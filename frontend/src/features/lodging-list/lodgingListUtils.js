import { createPortal } from "react-dom";
import L from "leaflet";
import { CHOSEONG, WEEK_DAYS } from "./lodgingListConstants";

export function buildPriceMarkerIcon(priceLabel, active = false) {
  return L.divIcon({
    className: "tz-map-marker-shell",
    html: `<div class="tz-map-marker${active ? " is-active" : ""}"><span>${priceLabel}</span></div>`,
    iconSize: [104, 34],
    iconAnchor: [52, 17],
  });
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function getInitialConsonants(value) {
  return Array.from(String(value ?? ""))
    .map((char) => {
      const code = char.charCodeAt(0) - 44032;
      if (code < 0 || code > 11171) return char.toLowerCase();
      return CHOSEONG[Math.floor(code / 588)] ?? "";
    })
    .join("");
}

export function matchesSuggestionKeyword(item, keyword) {
  const term = normalizeText(keyword);
  if (!term) return false;
  const fields = [item.label, item.subtitle, item.region, ...(item.aliases ?? [])].filter(Boolean);
  return fields.some((field) => normalizeText(field).includes(term)) || fields.some((field) => getInitialConsonants(field).includes(term));
}

export function scoreSuggestion(item, keyword) {
  const term = normalizeText(keyword);
  if (!term) return -Infinity;

  const label = normalizeText(item.label);
  const subtitle = normalizeText(item.subtitle);
  const region = normalizeText(item.region);
  const aliases = (item.aliases ?? []).map((field) => normalizeText(field));
  const labelInitials = getInitialConsonants(item.label);
  const subtitleInitials = getInitialConsonants(item.subtitle);

  let score = 0;
  if (item.type === "region") score += 60;
  if (item.type === "hotel") score += 40;
  if (item.type === "station") score += 10;
  if (label === term) score += 300;
  else if (label.startsWith(term)) score += 180;
  else if (label.includes(term)) score += 120;
  if (region === term) score += 220;
  else if (region.startsWith(term)) score += 140;
  else if (region.includes(term)) score += 90;
  if (subtitle.includes(term)) score += 60;
  if (aliases.some((field) => field === term)) score += 100;
  else if (aliases.some((field) => field.startsWith(term))) score += 70;
  else if (aliases.some((field) => field.includes(term))) score += 40;
  if (labelInitials === term) score += 110;
  else if (labelInitials.includes(term)) score += 70;
  if (subtitleInitials.includes(term)) score += 30;

  return score;
}

export function computePosition(anchorRect, wantedWidth, wantedHeight, options = {}) {
  const { preferBelow = false } = options;
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = clamp(anchorRect.left, margin, viewportWidth - wantedWidth - margin);
  let top = anchorRect.bottom + 8;

  if (!preferBelow && top + wantedHeight > viewportHeight - margin) {
    top = clamp(anchorRect.top - wantedHeight - 8, margin, viewportHeight - wantedHeight - margin);
  }

  return { left, top };
}

export function parseISO(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function monthGrid(baseDate) {
  const first = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
  if (days[35].getMonth() !== baseDate.getMonth()) {
    days.splice(35, 7);
  }
  return days;
}

export function sameDate(left, right) {
  return (
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function betweenDate(day, start, end) {
  if (!start || !end) return false;
  const time = day.getTime();
  return time > start.getTime() && time < end.getTime();
}

export function formatDateSummary(checkIn, checkOut) {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (!start || !end) return "날짜를 선택하세요";
  const nights = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  return `${start.getMonth() + 1}.${start.getDate()} ${WEEK_DAYS[start.getDay()]} - ${end.getMonth() + 1}.${end.getDate()} ${WEEK_DAYS[end.getDay()]} · ${nights}박`;
}

export function toPriceNumber(value) {
  return Number(String(value || "").replace(/[^\d]/g, ""));
}

export function buildPriceMeta(lodging, index) {
  const currentPrice = toPriceNumber(lodging.price);
  const rateSeed = [0, 8, 11, 14, 17][(lodging.id + index) % 5];
  if (!rateSeed) {
    return { current: lodging.price, original: "", discount: "" };
  }
  const originalPrice = Math.round((currentPrice / (1 - rateSeed / 100)) / 1000) * 1000;
  return {
    current: lodging.price,
    original: `${originalPrice.toLocaleString()}원`,
    discount: `${rateSeed}%`,
  };
}

export function matchesTheme(lodging, theme) {
  if (!theme || theme === "all") return true;
  if (theme === "ocean") return [lodging.type, lodging.intro, ...lodging.highlights].some((item) => String(item).includes("오션"));
  if (theme === "cancel") return lodging.cancellation.includes("무료 취소");
  if (theme === "breakfast") return [lodging.benefit, ...lodging.highlights].some((item) => String(item).includes("조식"));
  if (theme === "deal") {
    return [lodging.benefit, lodging.intro].some((item) => ["특가", "할인", "연박", "쿠폰"].some((keyword) => String(item).includes(keyword)));
  }
  if (theme === "private") return [lodging.type, lodging.room, lodging.intro].some((item) => String(item).includes("독채"));
  return true;
}

export function getLodgingTypeKey(lodging) {
  const text = [lodging.type, lodging.room, lodging.intro].join(" ");
  if (text.includes("독채")) return "private";
  if (text.includes("한옥")) return "hanok";
  if (text.includes("부티크")) return "boutique";
  return "hotel";
}

export function hasFeature(lodging, feature) {
  if (feature === "cancel") return lodging.cancellation.includes("무료 취소");
  if (feature === "breakfast") return [lodging.benefit, ...lodging.highlights].some((item) => String(item).includes("조식"));
  if (feature === "ocean") return [lodging.type, lodging.intro, ...lodging.highlights].some((item) => String(item).includes("오션") || String(item).includes("바다"));
  if (feature === "stayDeal") {
    return [lodging.benefit, lodging.intro].some((item) => ["연박", "쿠폰", "플래터", "업그레이드"].some((keyword) => String(item).includes(keyword)));
  }
  if (feature === "instant") return [lodging.benefit, ...lodging.highlights].some((item) => String(item).includes("즉시") || String(item).includes("확정"));
  if (feature === "deal") return toPriceNumber(lodging.price) <= 160000;
  return true;
}

export function isAvailableLodging(lodging) {
  return ![2, 5].includes(lodging.id);
}

export function reviewCountNumber(value) {
  return Number(String(value ?? "").replace(/[^\d]/g, ""));
}

export function getLodgingMeta(lodging) {
  const source = [lodging.type, lodging.intro, lodging.benefit, lodging.review, lodging.cancellation, lodging.room, ...lodging.highlights].join(" ");
  const meta = { tastes: [], discounts: [], grades: [], facilities: [] };

  if (["제주", "경북"].includes(lodging.region)) meta.tastes.push("family");
  if (["감성", "부티크", "한옥"].some((keyword) => source.includes(keyword))) meta.tastes.push("emotional");
  if (["오션", "노을", "바다", "마리나"].some((keyword) => source.includes(keyword))) meta.tastes.push("view");
  if (["연박", "플래터", "업그레이드"].some((keyword) => source.includes(keyword))) meta.tastes.push("longStay");
  if (Number(lodging.rating) >= 4.8 || reviewCountNumber(lodging.reviewCount) >= 200) meta.tastes.push("reviewed");
  if (source.includes("바비큐")) meta.tastes.push("bbq");
  if (source.includes("인피니티풀")) meta.tastes.push("pool");
  if (source.includes("일출") || source.includes("해운대")) meta.tastes.push("sunrise");

  if (source.includes("쿠폰") || source.includes("웰컴")) meta.discounts.push("coupon");
  if (lodging.cancellation.includes("무료 취소")) meta.discounts.push("cancel");
  if (["특가", "연박", "즉시"].some((keyword) => source.includes(keyword))) meta.discounts.push("deal");

  if (["마리나 리조트", "오션뷰 호텔"].some((keyword) => source.includes(keyword))) meta.grades.push("5star");
  if (["리조트", "부티크 호텔", "한옥 스테이"].some((keyword) => source.includes(keyword))) meta.grades.push("4star");
  if (source.includes("독채")) meta.grades.push("poolvilla");
  if (Number(lodging.rating) >= 4.9) meta.grades.push("black");

  if (["인피니티풀", "오션 테라스"].some((keyword) => source.includes(keyword))) meta.facilities.push("pool");
  if (source.includes("바비큐")) meta.facilities.push("bbq");
  if (source.includes("인룸 다이닝") || source.includes("조식")) meta.facilities.push("restaurant");
  if (source.includes("라운지")) meta.facilities.push("fitness");
  if (source.includes("스위트")) meta.facilities.push("spa");
  meta.facilities.push("wifi", "aircon", "amenities");
  if (source.includes("조식")) meta.facilities.push("breakfast");
  meta.facilities.push("parking");
  if (source.includes("독채")) meta.facilities.push("cook");

  return {
    tastes: Array.from(new Set(meta.tastes)),
    discounts: Array.from(new Set(meta.discounts)),
    grades: Array.from(new Set(meta.grades)),
    facilities: Array.from(new Set(meta.facilities)),
  };
}

export function matchesPriceBand(lodging, band) {
  const price = toPriceNumber(lodging.price);
  if (band === "under150") return price < 150000;
  if (band === "150to180") return price >= 150000 && price < 180000;
  if (band === "180to220") return price >= 180000 && price < 220000;
  if (band === "over220") return price >= 220000;
  return true;
}

export function queryNumber(value, fallback) {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function matchesKeyword(lodging, keyword) {
  if (!keyword.trim()) return true;
  const normalized = keyword.trim().toLowerCase();
  return [lodging.name, lodging.region, lodging.district, lodging.type, lodging.intro, lodging.room, lodging.address, ...lodging.highlights].some((item) =>
    String(item || "").toLowerCase().includes(normalized),
  );
}

export { createPortal };
