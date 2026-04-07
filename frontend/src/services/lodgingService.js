import { lodgings as fallbackLodgings } from "../data/lodgingData";
import { del, get, getApiBaseUrl, patch, post } from "../lib/appClient";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80";
export const LODGING_FALLBACK_IMAGE = FALLBACK_IMAGE;
const FALLBACK_IMAGE_POOL = [
  FALLBACK_IMAGE,
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1400&q=80",
];
const LODGINGS_CACHE_KEY = "tripzone-lodgings-cache-v2";
const LODGINGS_INVALIDATED_AT_KEY = "tripzone-lodgings-invalidated-at";
const LODGINGS_CACHE_TTL = 1000 * 60 * 5;
const FALLBACK_COORDS = {
  latitude: 37.5665,
  longitude: 126.978,
};
const LODGINGS_INVALIDATED_EVENT = "tripzone:lodgings-invalidated";
const LODGING_TYPE_LABELS = {
  HOTEL: "호텔",
  PENSION: "펜션",
  GUESTHOUSE: "게스트하우스",
  MOTEL: "모텔",
  RESORT: "리조트",
};
const fallbackLodgingMap = new Map(fallbackLodgings.map((item) => [Number(item.id), item]));
let lodgingsMemoryCache = null;
let lodgingsRequestPromise = null;

function isCorruptedText(value) {
  if (typeof value !== "string") return false;
  const cleaned = value.trim();
  if (!cleaned) return false;
  if (/^[.\-·,/_|]+$/.test(cleaned)) return true;
  return cleaned.includes("?") && !/[가-힣A-Za-z]/.test(cleaned);
}

function pickText(primary, fallback, defaultValue = "") {
  if (typeof primary === "string" && primary.trim() && !isCorruptedText(primary)) {
    return primary;
  }
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback;
  }
  return defaultValue;
}

function joinMetaParts(...parts) {
  return parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part && !isCorruptedText(part))
    .join(" · ");
}

function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "문의 필요";
  return `${numeric.toLocaleString()}원`;
}

function normalizeReviewCount(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `${numeric.toLocaleString()}개`;
  }
  if (typeof value !== "string") return "0개";
  const match = value.match(/(\d[\d,]*)/);
  if (!match) return "0개";
  return `${match[1]}개`;
}

function normalizeRating(primary, fallback) {
  const numeric = Number(primary);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric.toFixed(1);
  }
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback;
  }
  return "0.0";
}

function buildDistrict(address, region) {
  const cleaned = String(address ?? "").trim();
  if (!cleaned) return region || "위치 확인 필요";

  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts[1] ?? parts[0] ?? region ?? "위치 확인 필요";
}

function buildHighlights(dto) {
  const items = [
    dto.status === "ACTIVE" ? "즉시 예약 가능" : "운영 상태 확인 필요",
    dto.checkInTime ? `체크인 ${dto.checkInTime}` : null,
    dto.checkOutTime ? `체크아웃 ${dto.checkOutTime}` : null,
  ].filter(Boolean);

  return items.length ? items : ["숙소 상세 정보 확인", "객실 옵션 확인", "위치 정보 확인"];
}

function buildImageUrl(fileName) {
  if (!fileName) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(fileName)) return fileName;
  return `${getApiBaseUrl()}/api/lodgings/view/${encodeURIComponent(fileName)}`;
}

function pickFallbackImage(seed) {
  const numericSeed = Number(seed ?? 0);
  const index = Number.isFinite(numericSeed) ? Math.abs(numericSeed) % FALLBACK_IMAGE_POOL.length : 0;
  return FALLBACK_IMAGE_POOL[index];
}

function getMappedRoomImages(roomDTO, lodgingDTO) {
  const roomImages = Array.isArray(roomDTO.imageUrls) ? roomDTO.imageUrls.map(buildImageUrl).filter(Boolean) : [];
  if (roomImages.length) {
    return roomImages;
  }

  const lodgingImages = Array.isArray(lodgingDTO.uploadFileNames)
    ? lodgingDTO.uploadFileNames.map(buildImageUrl).filter(Boolean)
    : [];
  if (lodgingImages.length) {
    return lodgingImages;
  }

  return [pickFallbackImage(roomDTO.roomNo ?? lodgingDTO.lodgingNo)];
}

function buildGalleryCandidates(dto, rooms, fallback) {
  const lodgingImages = Array.isArray(dto.uploadFileNames)
    ? dto.uploadFileNames.map(buildImageUrl).filter(Boolean)
    : [];
  if (lodgingImages.length) {
    return lodgingImages;
  }

  const roomImages = rooms.flatMap((room) => room.imageUrls ?? []).filter(Boolean);
  if (roomImages.length) {
    return Array.from(new Set(roomImages));
  }

  if (fallback?.image) {
    return [fallback.image];
  }

  return [pickFallbackImage(dto.lodgingNo)];
}

function buildReviewImageUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/api/")) {
    return `${getApiBaseUrl()}${value}`;
  }
  return `${getApiBaseUrl()}/api/view/${encodeURIComponent(value)}`;
}

function mapRoom(roomDTO, lodgingDTO) {
  const roomName = pickText(roomDTO.roomName, "", "객실 정보 확인 필요");
  const roomType = pickText(roomDTO.roomType, "", "객실");
  const roomDescription = pickText(roomDTO.roomDescription, "", "객실 설명 준비 중");
  return {
    roomId: roomDTO.roomNo,
    lodgingId: roomDTO.lodgingNo ?? lodgingDTO.lodgingNo,
    name: roomName,
    type: roomType,
    description: roomDescription,
    maxGuestCount: roomDTO.maxGuestCount ?? 2,
    pricePerNight: roomDTO.pricePerNight ?? 0,
    price: formatCurrency(roomDTO.pricePerNight),
    roomCount: roomDTO.roomCount ?? 1,
    status: roomDTO.status,
    imageUrls: getMappedRoomImages(roomDTO, lodgingDTO),
  };
}

function mapLodging(dto) {
  const fallback = fallbackLodgingMap.get(Number(dto.lodgingNo));
  const rooms = (dto.rooms ?? []).map((roomDTO) => mapRoom(roomDTO, dto));
  const firstRoom = rooms[0] ?? null;
  const region = pickText(dto.region, fallback?.region, "위치 확인 필요");
  const address = pickText(dto.address, fallback?.address, "");
  const lodgingName = pickText(dto.lodgingName, fallback?.name, `숙소 ${dto.lodgingNo}`);
  const description = pickText(dto.description, fallback?.intro, "숙소 소개 준비 중입니다.");
  const district = pickText(dto.district, fallback?.district, buildDistrict(address, region));
  const galleryCandidates = buildGalleryCandidates(dto, rooms, fallback);
  const resolvedImage = galleryCandidates[0] ?? fallback?.image ?? pickFallbackImage(dto.lodgingNo);
  const fallbackRoomLabel = pickText(fallback?.room, "", "객실 정보 확인 필요");
  const fallbackPriceLabel = fallback?.price ?? "문의 필요";
  const firstRoomName = firstRoom && !isCorruptedText(firstRoom.name) ? firstRoom.name : fallbackRoomLabel.split("·")[0].trim();
  const lodgingType = pickText(LODGING_TYPE_LABELS[dto.lodgingType], dto.lodgingType, fallback?.type ?? "숙소");
  const roomLabel = firstRoom
    ? joinMetaParts(firstRoom.name, `최대 ${firstRoom.maxGuestCount}인`) || "객실 정보 확인 필요"
    : fallbackRoomLabel;

  return {
    id: dto.lodgingNo,
    lodgingId: dto.lodgingNo,
    hostId: dto.hostNo,
    name: lodgingName,
    type: lodgingType,
    region,
    district,
    address,
    detailAddress: dto.detailAddress ?? "",
    zipCode: dto.zipCode ?? "",
    latitude: dto.latitude ?? FALLBACK_COORDS.latitude,
    longitude: dto.longitude ?? FALLBACK_COORDS.longitude,
    intro: description,
    description,
    summary: `${dto.checkInTime ?? "체크인 확인"} · ${dto.checkOutTime ?? "체크아웃 확인"} · ${dto.status ?? "상태 확인"}`,
    image: resolvedImage,
    galleryImages: galleryCandidates,
    checkInTime: dto.checkInTime ?? "15:00",
    checkOutTime: dto.checkOutTime ?? "11:00",
    status: dto.status,
    highlights: buildHighlights(dto),
    rating: normalizeRating(dto.reviewAverage, fallback?.rating),
    reviewCount: normalizeReviewCount(dto.reviewCount ?? fallback?.reviewCount),
    benefit: firstRoom ? `${firstRoomName} 예약 가능` : "객실 옵션 확인 가능",
    review: description,
    cancellation: "취소 규정은 예약 단계에서 확인해 주세요.",
    room: roomLabel,
    price: firstRoom ? formatCurrency(firstRoom.pricePerNight) : fallbackPriceLabel,
    rooms,
  };
}

function buildCollection(ids, title, region, rows) {
  const existingIds = ids.filter((id) => rows.some((item) => item.id === id));
  if (!existingIds.length) return null;

  return {
    title,
    region,
    ids: existingIds,
  };
}

function readCachedLodgings() {
  if (lodgingsMemoryCache?.rows?.length) {
    return lodgingsMemoryCache.rows;
  }

  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(LODGINGS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed.rows)) return [];
    if (Date.now() - parsed.savedAt > LODGINGS_CACHE_TTL) return [];

    lodgingsMemoryCache = parsed;
    return parsed.rows;
  } catch {
    return [];
  }
}

function writeCachedLodgings(rows) {
  const payload = {
    savedAt: Date.now(),
    rows,
  };

  lodgingsMemoryCache = payload;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(LODGINGS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // 저장 공간 문제는 무시하고 네트워크 결과만 사용한다.
  }
}

export function invalidateLodgingsCache() {
  lodgingsMemoryCache = null;
  lodgingsRequestPromise = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(LODGINGS_CACHE_KEY);
    window.localStorage.setItem(LODGINGS_INVALIDATED_AT_KEY, String(Date.now()));
    window.dispatchEvent(new CustomEvent(LODGINGS_INVALIDATED_EVENT));
  } catch {
    // 캐시 삭제 실패는 무시한다.
  }
}

export function subscribeLodgingsInvalidated(onInvalidate) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event) => {
    if (event.key !== LODGINGS_INVALIDATED_AT_KEY) return;
    lodgingsMemoryCache = null;
    lodgingsRequestPromise = null;
    onInvalidate();
  };

  window.addEventListener(LODGINGS_INVALIDATED_EVENT, onInvalidate);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(LODGINGS_INVALIDATED_EVENT, onInvalidate);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getCachedLodgingsSnapshot() {
  return readCachedLodgings();
}

export async function getLodgings() {
  const cachedRows = readCachedLodgings();
  if (cachedRows.length) {
    return cachedRows;
  }

  if (!lodgingsRequestPromise) {
    lodgingsRequestPromise = (async () => {
      const rows = await get("/api/lodgings/list");
      const mappedRows = rows.map(mapLodging);
      writeCachedLodgings(mappedRows);
      return mappedRows;
    })().finally(() => {
      lodgingsRequestPromise = null;
    });
  }

  return lodgingsRequestPromise;
}

export async function getLodgingById(lodgingId) {
  const row = await get(`/api/lodgings/${lodgingId}`);
  return mapLodging(row);
}

export async function getLodgingDetailById(lodgingId) {
  const row = await get(`/api/lodgings/${lodgingId}/detail`);
  return mapLodging(row);
}

export async function getLodgingCollections(prefetchedRows) {
  const rows = prefetchedRows ?? await getLodgings();

  return [
    buildCollection(
      rows.filter((item) => item.region === "부산").map((item) => item.id).slice(0, 4),
      "이번 주말 예약 가능한 부산 숙소",
      "부산",
      rows,
    ),
    buildCollection(
      rows.filter((item) => item.region === "제주").map((item) => item.id).slice(0, 4),
      "제주 감도 높은 스테이",
      "제주",
      rows,
    ),
    buildCollection(rows.map((item) => item.id).slice(0, 4), "지금 둘러보기 좋은 숙소", rows[0]?.region ?? "국내", rows),
  ].filter(Boolean);
}

export async function getSearchSuggestionItems(prefetchedRows) {
  const rows = prefetchedRows ?? await getLodgings();
  const unique = new Map();

  rows.forEach((lodging) => {
    [
      { label: lodging.name, subtitle: [lodging.type, joinMetaParts(lodging.region, lodging.district)].filter(Boolean).join(", "), type: "hotel" },
      { label: lodging.region, subtitle: `${lodging.region} 인기 숙소`, type: "region" },
      { label: lodging.district, subtitle: joinMetaParts(lodging.region, lodging.district), type: "region" },
    ].forEach((item) => {
      const key = `${item.type}-${item.label}-${item.subtitle}`;
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });
  });

  return Array.from(unique.values());
}

function formatReviewTime(value) {
  if (!value) return "작성 시각 확인";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "작성 시각 확인";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function mapReviewDto(dto) {
  return {
    id: dto.reviewNo,
    bookingNo: dto.bookingNo,
    userNo: dto.userNo ?? null,
    author: dto.userName ?? (dto.userNo ? `여행자 ${dto.userNo}` : "여행자"),
    score: Number(dto.rating ?? 0),
    stay: formatReviewTime(dto.regDate),
    body: dto.content ?? "",
    imageFileNames: dto.imageUrls ?? [],
    imageUrls: (dto.imageUrls ?? []).map(buildReviewImageUrl),
  };
}

export async function getLodgingReviews(lodgingId) {
  const rows = await get(`/api/reviews/lodgings/${lodgingId}`);
  return rows.map(mapReviewDto);
}

export async function uploadLodgingReviewImages(files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await post("/api/reviews/images", formData);
  return (response.imageUrls ?? []).map((fileName) => ({
    fileName,
    previewUrl: buildReviewImageUrl(fileName),
  }));
}

export async function createLodgingReview(payload) {
  const response = await post("/api/reviews", {
    bookingNo: payload.bookingNo,
    lodgingNo: payload.lodgingId,
    rating: Math.round(payload.score),
    content: payload.body,
    imageUrls: payload.imageFileNames ?? [],
  });

  return mapReviewDto(response);
}

export async function updateLodgingReview(reviewId, payload) {
  const response = await patch(`/api/reviews/${reviewId}`, {
    rating: Math.round(payload.score),
    content: payload.body,
    imageUrls: payload.imageFileNames ?? [],
  });

  return mapReviewDto(response);
}

export async function deleteLodgingReview(reviewId) {
  await del(`/api/reviews/${reviewId}`);
  return { ok: true };
}
