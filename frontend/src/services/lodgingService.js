import { lodgings as fallbackLodgings } from "../data/lodgingData";
import { get, getApiBaseUrl, post } from "../lib/appClient";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80";
const FALLBACK_COORDS = {
  latitude: 37.5665,
  longitude: 126.978,
};
const fallbackLodgingMap = new Map(fallbackLodgings.map((item) => [Number(item.id), item]));

function isCorruptedText(value) {
  if (typeof value !== "string") return false;
  const cleaned = value.trim();
  if (!cleaned) return false;
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

function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "문의 필요";
  return `${numeric.toLocaleString()}원`;
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
  return `http://100.96.110.114:8080/api/lodgings/view/${encodeURIComponent(fileName)}`;
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
  return {
    roomId: roomDTO.roomNo,
    lodgingId: roomDTO.lodgingNo ?? lodgingDTO.lodgingNo,
    name: roomDTO.roomName,
    type: roomDTO.roomType ?? "객실",
    description: roomDTO.roomDescription ?? "객실 설명 준비 중",
    maxGuestCount: roomDTO.maxGuestCount ?? 2,
    pricePerNight: roomDTO.pricePerNight ?? 0,
    price: formatCurrency(roomDTO.pricePerNight),
    roomCount: roomDTO.roomCount ?? 1,
    status: roomDTO.status,
    imageUrls: roomDTO.imageUrls?.length ? roomDTO.imageUrls : [buildImageUrl(lodgingDTO.uploadFileNames?.[0])],
  };
}

function mapLodging(dto) {
  const fallback = fallbackLodgingMap.get(Number(dto.lodgingNo));
  const rooms = (dto.rooms ?? []).map((roomDTO) => mapRoom(roomDTO, dto));
  const firstRoom = rooms[0] ?? null;
  const image = buildImageUrl(dto.uploadFileNames?.[0]);
  const region = pickText(dto.region, fallback?.region, "위치 확인 필요");
  const address = pickText(dto.address, fallback?.address, "");
  const lodgingName = pickText(dto.lodgingName, fallback?.name, `숙소 ${dto.lodgingNo}`);
  const description = pickText(dto.description, fallback?.intro, "숙소 소개 준비 중입니다.");
  const district = fallback?.district ?? buildDistrict(address, region);
  const resolvedImage = dto.uploadFileNames?.[0] ? image : fallback?.image ?? image;
  const fallbackRoomLabel = fallback?.room ?? "객실 정보 확인 필요";
  const fallbackPriceLabel = fallback?.price ?? "문의 필요";
  const firstRoomName = firstRoom && !isCorruptedText(firstRoom.name) ? firstRoom.name : fallbackRoomLabel.split("·")[0].trim();

  return {
    id: dto.lodgingNo,
    lodgingId: dto.lodgingNo,
    hostId: dto.hostNo,
    name: lodgingName,
    type: dto.lodgingType,
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
    galleryImages: dto.uploadFileNames?.length ? dto.uploadFileNames.map(buildImageUrl) : [resolvedImage],
    checkInTime: dto.checkInTime ?? "15:00",
    checkOutTime: dto.checkOutTime ?? "11:00",
    status: dto.status,
    highlights: buildHighlights(dto),
    rating: "4.8",
    reviewCount: "후기 준비 중",
    benefit: firstRoom ? `${firstRoomName} 예약 가능` : "객실 옵션 확인 가능",
    review: "실제 후기 연동 전입니다.",
    cancellation: "취소 규정은 예약 단계에서 확인해 주세요.",
    room: firstRoom && !isCorruptedText(firstRoom.name) ? `${firstRoom.name} · 최대 ${firstRoom.maxGuestCount}인` : fallbackRoomLabel,
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

export async function getLodgings() {
  const rows = await get("/api/lodgings/list");
  const rowsWithRooms = await Promise.all(
    rows.map(async (row) => {
      if (Array.isArray(row.rooms) && row.rooms.length) return row;

      try {
        const rooms = await get(`/api/rooms/lodging/${row.lodgingNo}`);
        return { ...row, rooms };
      } catch {
        return row;
      }
    }),
  );

  return rowsWithRooms.map(mapLodging);
}

export async function getLodgingById(lodgingId) {
  const row = await get(`/api/lodgings/${lodgingId}`);
  return mapLodging(row);
}

export async function getLodgingDetailById(lodgingId) {
  const row = await get(`/api/lodgings/${lodgingId}/detail`);
  return mapLodging(row);
}

export async function getLodgingCollections() {
  const rows = await getLodgings();

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

export async function getSearchSuggestionItems() {
  const rows = await getLodgings();
  const unique = new Map();

  rows.forEach((lodging) => {
    [
      { label: lodging.name, subtitle: `${lodging.type}, ${lodging.region} ${lodging.district}`, type: "hotel" },
      { label: lodging.region, subtitle: `${lodging.region} 인기 숙소`, type: "region" },
      { label: lodging.district, subtitle: `${lodging.region} ${lodging.district}`, type: "region" },
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
    author: `회원 ${dto.userNo ?? ""}`.trim(),
    score: Number(dto.rating ?? 0).toFixed(1),
    stay: formatReviewTime(dto.regDate),
    body: dto.content ?? "",
    images: (dto.imageUrls ?? []).map(buildReviewImageUrl),
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
  return (response.imageUrls ?? []).map(buildReviewImageUrl);
}

export async function createLodgingReview(payload) {
  const response = await post("/api/reviews", {
    bookingNo: payload.bookingNo,
    lodgingNo: payload.lodgingId,
    rating: Math.round(payload.score),
    content: payload.body,
    imageUrls: payload.images ?? [],
  });

  return mapReviewDto(response);
}
