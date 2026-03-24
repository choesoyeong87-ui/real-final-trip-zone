import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
  homeSearchDefaults,
  lodgingSortOptions,
  lodgings,
  searchSuggestionItems,
} from "../../data/siteData";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const LODGING_TYPE_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "호텔 · 리조트", value: "hotel" },
  { label: "독채", value: "private" },
  { label: "한옥", value: "hanok" },
  { label: "부티크", value: "boutique" },
];
const LODGING_FEATURE_OPTIONS = [
  { label: "무료 취소", value: "cancel" },
  { label: "조식 포함", value: "breakfast" },
  { label: "오션뷰", value: "ocean" },
  { label: "연박 혜택", value: "stayDeal" },
  { label: "즉시 확정", value: "instant" },
  { label: "가성비", value: "deal" },
];
const PRICE_BAND_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "15만원 이하", value: "under150" },
  { label: "15만~18만원", value: "150to180" },
  { label: "18만~22만원", value: "180to220" },
  { label: "22만원 이상", value: "over220" },
];
const REGION_FILTER_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "서울", value: "서울" },
  { label: "경기 · 인천", value: "경기" },
  { label: "부산", value: "부산" },
  { label: "제주", value: "제주" },
  { label: "강원", value: "강원" },
  { label: "여수", value: "전남" },
  { label: "경주", value: "경북" },
];
const TASTE_OPTIONS = [
  { label: "#가족여행숙소", value: "family" },
  { label: "#감성숙소", value: "emotional" },
  { label: "#뷰맛집", value: "view" },
  { label: "#연박특가", value: "longStay" },
  { label: "#리뷰좋은", value: "reviewed" },
  { label: "#BBQ", value: "bbq" },
  { label: "#온수풀", value: "pool" },
  { label: "#해돋이명소", value: "sunrise" },
];
const DISCOUNT_OPTIONS = [
  { label: "쿠폰할인", value: "coupon" },
  { label: "무료 취소", value: "cancel" },
  { label: "할인특가", value: "deal" },
];
const GRADE_OPTIONS = [
  { label: "5성급", value: "5star" },
  { label: "4성급", value: "4star" },
  { label: "풀빌라", value: "poolvilla" },
  { label: "블랙", value: "black" },
];
const FACILITY_GROUPS = [
  {
    title: "공용시설",
    options: [
      { label: "수영장", value: "pool" },
      { label: "바베큐", value: "bbq" },
      { label: "레스토랑", value: "restaurant" },
      { label: "피트니스", value: "fitness" },
    ],
  },
  {
    title: "객실 내 시설",
    options: [
      { label: "객실스파", value: "spa" },
      { label: "무선인터넷", value: "wifi" },
      { label: "에어컨", value: "aircon" },
      { label: "욕실용품", value: "amenities" },
    ],
  },
  {
    title: "기타시설",
    options: [
      { label: "조식제공", value: "breakfast" },
      { label: "무료주차", value: "parking" },
      { label: "반려견동반", value: "pet" },
      { label: "객실내취사", value: "cook" },
    ],
  },
];

function buildPriceMarkerIcon(priceLabel, active = false) {
  return L.divIcon({
    className: "tz-map-marker-shell",
    html: `<div class="tz-map-marker${active ? " is-active" : ""}"><span>${priceLabel}</span></div>`,
    iconSize: [104, 34],
    iconAnchor: [52, 17],
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getInitialConsonants(value) {
  return Array.from(String(value ?? "")).map((char) => {
    const code = char.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return char.toLowerCase();
    return CHOSEONG[Math.floor(code / 588)] ?? "";
  }).join("");
}

function matchesSuggestionKeyword(item, keyword) {
  const term = normalizeText(keyword);
  if (!term) return false;
  const fields = [item.label, item.subtitle, item.region, ...(item.aliases ?? [])].filter(Boolean);
  return fields.some((field) => normalizeText(field).includes(term)) || fields.some((field) => getInitialConsonants(field).includes(term));
}

function scoreSuggestion(item, keyword) {
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

function computePosition(anchorRect, wantedWidth, wantedHeight) {
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = clamp(anchorRect.left, margin, viewportWidth - wantedWidth - margin);
  let top = anchorRect.bottom + 8;

  if (top + wantedHeight > viewportHeight - margin) {
    top = clamp(anchorRect.top - wantedHeight - 8, margin, viewportHeight - wantedHeight - margin);
  }

  return { left, top };
}

function parseISO(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthGrid(baseDate) {
  const first = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function sameDate(left, right) {
  return (
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function betweenDate(day, start, end) {
  if (!start || !end) return false;
  const time = day.getTime();
  return time > start.getTime() && time < end.getTime();
}

function formatDateSummary(checkIn, checkOut) {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (!start || !end) return "날짜를 선택하세요";
  const nights = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  return `${start.getMonth() + 1}.${start.getDate()} ${WEEK_DAYS[start.getDay()]} - ${end.getMonth() + 1}.${end.getDate()} ${WEEK_DAYS[end.getDay()]} · ${nights}박`;
}

function CalendarMonth({ baseDate, startDate, endDate, onPick }) {
  const days = monthGrid(baseDate);

  return (
    <div className="calendar-month">
      <div className="calendar-month-head">
        <strong>
          {baseDate.getFullYear()}.{String(baseDate.getMonth() + 1).padStart(2, "0")}
        </strong>
      </div>
      <div className="calendar-week-row">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === baseDate.getMonth();
          const isStart = sameDate(day, startDate);
          const isEnd = sameDate(day, endDate);
          const isBetween = betweenDate(day, startDate, endDate);

          return (
            <button
              key={toISO(day)}
              type="button"
              className={`calendar-day${isCurrentMonth ? "" : " is-muted"}${isStart ? " is-start" : ""}${isEnd ? " is-end" : ""}${isBetween ? " is-between" : ""}`}
              onClick={() => {
                if (!isCurrentMonth) return;
                onPick(day);
              }}
              disabled={!isCurrentMonth}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuggestionsPanel({ open, anchorRef, panelRef, items, onPick }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 520);
      const next = computePosition(rect, width, 340);
      setPosition({
        left: next.left,
        top: next.top,
        width,
        maxHeight: clamp(window.innerHeight - next.top - 12, 220, 360),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="search-floating-panel search-suggestion-panel"
      style={{ left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px`, maxHeight: `${position.maxHeight}px` }}
    >
      <div className="search-suggestion-group">
        <span className="search-chip-label">연관 검색</span>
        <div className="search-suggestion-list search-suggestion-list-stacked">
          {items.length ? (
            items.map((item) => (
              <button key={`${item.type}-${item.label}`} type="button" className="search-suggestion-item" onClick={() => onPick(item)}>
                <span className="search-suggestion-icon">{item.type === "hotel" ? "■" : item.type === "station" ? "◆" : "●"}</span>
                <div className="search-suggestion-copy">
                  <strong>{item.label}</strong>
                  <span>{item.subtitle}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="search-suggestion-empty">
              <strong>검색어를 입력하세요</strong>
              <span>지역명, 숙소명, 랜드마크를 입력하면 연관 검색이 표시됩니다.</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DateRangePopover({ open, anchorRef, panelRef, visibleMonth, setVisibleMonth, checkIn, checkOut, onPick, onClose }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 960;
      const width = isMobile ? Math.min(window.innerWidth - 24, 420) : Math.min(window.innerWidth - 24, 720);
      const next = computePosition(rect, width, isMobile ? 540 : 500);
      setPosition({
        left: next.left,
        top: next.top,
        width,
        maxHeight: clamp(window.innerHeight - next.top - 12, 320, isMobile ? 540 : 500),
        isMobile,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open]);

  if (!open || !position) return null;
  const startDate = parseISO(checkIn);
  const endDate = parseISO(checkOut);

  return createPortal(
    <div
      ref={panelRef}
      className="search-floating-panel search-calendar-panel"
      style={{ left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px`, maxHeight: `${position.maxHeight}px` }}
    >
      <div className="calendar-toolbar">
        <button type="button" className="calendar-nav" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>이전</button>
        <button type="button" className="calendar-nav" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>다음</button>
      </div>
      <div className="calendar-month-grid" style={{ gridTemplateColumns: position.isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        <CalendarMonth baseDate={visibleMonth} startDate={startDate} endDate={endDate} onPick={onPick} />
        {!position.isMobile ? (
          <CalendarMonth baseDate={new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)} startDate={startDate} endDate={endDate} onPick={onPick} />
        ) : null}
      </div>
      <div className="calendar-footer">
        <span className="calendar-footer-text">{formatDateSummary(checkIn, checkOut)}</span>
        <button type="button" className="primary-button calendar-apply-button" onClick={onClose}>적용</button>
      </div>
    </div>,
    document.body,
  );
}

function GuestPopover({ open, anchorRef, panelRef, guests, onChange, onClose }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = clamp(Math.max(rect.width, 320), 280, 360);
      const next = computePosition(rect, width, 156);
      setPosition({ left: next.left, top: next.top, width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, open]);

  if (!open || !position) return null;

  return createPortal(
    <div ref={panelRef} className="search-floating-panel guest-panel" style={{ left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px` }}>
      <div className="guest-panel-row">
        <div>
          <strong>성인</strong>
          <span>객실 1개 기준</span>
        </div>
        <div className="guest-stepper">
          <button type="button" className="guest-stepper-button" onClick={() => onChange(String(Math.max(1, Number(guests) - 1)))}>-</button>
          <strong>{guests}</strong>
          <button type="button" className="guest-stepper-button" onClick={() => onChange(String(Math.min(8, Number(guests) + 1)))}>+</button>
        </div>
      </div>
      <button type="button" className="primary-button search-flyout-confirm" onClick={onClose}>인원 선택 완료</button>
    </div>,
    document.body,
  );
}

function toPriceNumber(value) {
  return Number(String(value || "").replace(/[^\d]/g, ""));
}

function buildPriceMeta(lodging, index) {
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

function matchesTheme(lodging, theme) {
  if (!theme || theme === "all") return true;

  if (theme === "ocean") {
    return [lodging.type, lodging.intro, ...lodging.highlights].some((item) => String(item).includes("오션"));
  }

  if (theme === "cancel") {
    return lodging.cancellation.includes("무료 취소");
  }

  if (theme === "breakfast") {
    return [lodging.benefit, ...lodging.highlights].some((item) => String(item).includes("조식"));
  }

  if (theme === "deal") {
    return [lodging.benefit, lodging.intro].some((item) =>
      ["특가", "할인", "연박", "쿠폰"].some((keyword) => String(item).includes(keyword)),
    );
  }

  if (theme === "private") {
    return [lodging.type, lodging.room, lodging.intro].some((item) => String(item).includes("독채"));
  }

  return true;
}

function getLodgingTypeKey(lodging) {
  const text = [lodging.type, lodging.room, lodging.intro].join(" ");
  if (text.includes("독채")) return "private";
  if (text.includes("한옥")) return "hanok";
  if (text.includes("부티크")) return "boutique";
  return "hotel";
}

function hasFeature(lodging, feature) {
  if (feature === "cancel") return lodging.cancellation.includes("무료 취소");
  if (feature === "breakfast") return [lodging.benefit, ...lodging.highlights].some((item) => String(item).includes("조식"));
  if (feature === "ocean") return [lodging.type, lodging.intro, ...lodging.highlights].some((item) => String(item).includes("오션") || String(item).includes("바다"));
  if (feature === "stayDeal") return [lodging.benefit, lodging.intro].some((item) => ["연박", "쿠폰", "플래터", "업그레이드"].some((keyword) => String(item).includes(keyword)));
  if (feature === "instant") return [lodging.benefit, ...lodging.highlights].some((item) => String(item).includes("즉시") || String(item).includes("확정"));
  if (feature === "deal") return toPriceNumber(lodging.price) <= 160000;
  return true;
}

function isAvailableLodging(lodging) {
  return ![2, 5].includes(lodging.id);
}

function getLodgingMeta(lodging) {
  const source = [lodging.type, lodging.intro, lodging.benefit, lodging.review, lodging.cancellation, lodging.room, ...lodging.highlights].join(" ");
  const meta = {
    tastes: [],
    discounts: [],
    grades: [],
    facilities: [],
  };

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

function matchesPriceBand(lodging, band) {
  const price = toPriceNumber(lodging.price);
  if (band === "under150") return price < 150000;
  if (band === "150to180") return price >= 150000 && price < 180000;
  if (band === "180to220") return price >= 180000 && price < 220000;
  if (band === "over220") return price >= 220000;
  return true;
}

function reviewCountNumber(value) {
  return Number(String(value ?? "").replace(/[^\d]/g, ""));
}

function queryNumber(value, fallback) {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function matchesKeyword(lodging, keyword) {
  if (!keyword.trim()) return true;
  const normalized = keyword.trim().toLowerCase();
  return [
    lodging.name,
    lodging.region,
    lodging.district,
    lodging.type,
    lodging.intro,
    lodging.room,
    lodging.address,
    ...lodging.highlights,
  ].some((item) => String(item || "").toLowerCase().includes(normalized));
}

export default function LodgingListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchShellRef = useRef(null);
  const toolbarRef = useRef(null);
  const keywordRef = useRef(null);
  const dateRef = useRef(null);
  const guestsRef = useRef(null);
  const suggestPanelRef = useRef(null);
  const calendarPanelRef = useRef(null);
  const guestPanelRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const keyword = searchParams.get("keyword") ?? homeSearchDefaults.keyword;
  const checkIn = searchParams.get("checkIn") ?? homeSearchDefaults.checkIn;
  const checkOut = searchParams.get("checkOut") ?? homeSearchDefaults.checkOut;
  const guests = searchParams.get("guests") ?? homeSearchDefaults.guests;
  const theme = searchParams.get("theme") ?? "all";
  const sort = searchParams.get("sort") ?? "recommended";
  const region = searchParams.get("region") ?? "";
  const type = searchParams.get("type") ?? "all";
  const priceBand = searchParams.get("priceBand") ?? "all";
  const regionFilter = searchParams.get("regionFilter") ?? "all";
  const features = (searchParams.get("features") ?? "").split(",").filter(Boolean);
  const tastes = (searchParams.get("tastes") ?? "").split(",").filter(Boolean);
  const discounts = (searchParams.get("discounts") ?? "").split(",").filter(Boolean);
  const grades = (searchParams.get("grades") ?? "").split(",").filter(Boolean);
  const facilities = (searchParams.get("facilities") ?? "").split(",").filter(Boolean);
  const minPrice = clamp(queryNumber(searchParams.get("minPrice"), 0), 0, 500000);
  const maxPrice = clamp(queryNumber(searchParams.get("maxPrice"), 500000), minPrice, 500000);
  const availableOnly = searchParams.get("available") === "1";

  const [searchForm, setSearchForm] = useState({
    keyword,
    checkIn,
    checkOut,
    guests,
  });
  const [activePanel, setActivePanel] = useState(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(parseISO(checkIn) ?? new Date());
  const filterSummary = [
    type !== "all" ? LODGING_TYPE_OPTIONS.find((item) => item.value === type)?.label : null,
    priceBand !== "all" ? PRICE_BAND_OPTIONS.find((item) => item.value === priceBand)?.label : null,
    regionFilter !== "all" ? REGION_FILTER_OPTIONS.find((item) => item.value === regionFilter)?.label : null,
    ...features.map((value) => LODGING_FEATURE_OPTIONS.find((item) => item.value === value)?.label).filter(Boolean),
    ...tastes.map((value) => TASTE_OPTIONS.find((item) => item.value === value)?.label).filter(Boolean),
    ...discounts.map((value) => DISCOUNT_OPTIONS.find((item) => item.value === value)?.label).filter(Boolean),
    ...grades.map((value) => GRADE_OPTIONS.find((item) => item.value === value)?.label).filter(Boolean),
    availableOnly ? "매진 제외" : null,
  ].filter(Boolean);

  const allSuggestionItems = useMemo(() => {
    const lodgingItems = lodgings.flatMap((lodging) => [
      {
        label: lodging.name,
        subtitle: `${lodging.type}, ${lodging.region} ${lodging.district}`,
        type: "hotel",
        region: lodging.region,
        aliases: [lodging.district, lodging.address, ...lodging.highlights],
      },
      {
        label: lodging.district,
        subtitle: `${lodging.region} ${lodging.district}`,
        type: "region",
        region: lodging.region,
        aliases: [lodging.name, lodging.address],
      },
      {
        label: lodging.region,
        subtitle: `${lodging.region} 인기 숙소`,
        type: "region",
        region: lodging.region,
        aliases: [lodging.district, lodging.name],
      },
      ...searchSuggestionItems,
    ]);
    const unique = new Map();
    lodgingItems.forEach((item) => {
      const key = `${item.type}-${item.label}-${item.subtitle}`;
      if (!unique.has(key)) unique.set(key, item);
    });
    return Array.from(unique.values());
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!searchForm.keyword.trim()) return [];
    return allSuggestionItems
      .filter((item) => matchesSuggestionKeyword(item, searchForm.keyword))
      .map((item) => ({ item, score: scoreSuggestion(item, searchForm.keyword) }))
      .sort((left, right) => right.score - left.score || left.item.label.localeCompare(right.item.label, "ko"))
      .map(({ item }) => item)
      .slice(0, 8);
  }, [allSuggestionItems, searchForm.keyword]);

  const optionCounts = useMemo(() => {
    const countBy = (options, matcher) =>
      options.map((option) => ({
        ...option,
        count: option.value === "all" ? lodgings.length : lodgings.filter((lodging) => matcher(lodging, option.value)).length,
      }));

    return {
      types: countBy(LODGING_TYPE_OPTIONS, (lodging, value) => getLodgingTypeKey(lodging) === value),
      priceBands: countBy(PRICE_BAND_OPTIONS, (lodging, value) => matchesPriceBand(lodging, value)),
      regions: countBy(REGION_FILTER_OPTIONS, (lodging, value) => lodging.region.includes(value)),
      features: countBy(LODGING_FEATURE_OPTIONS, (lodging, value) => hasFeature(lodging, value)),
      tastes: countBy(TASTE_OPTIONS, (lodging, value) => getLodgingMeta(lodging).tastes.includes(value)),
      discounts: countBy(DISCOUNT_OPTIONS, (lodging, value) => getLodgingMeta(lodging).discounts.includes(value)),
      grades: countBy(GRADE_OPTIONS, (lodging, value) => getLodgingMeta(lodging).grades.includes(value)),
      facilities: FACILITY_GROUPS.map((group) => ({
        ...group,
        options: group.options.map((option) => ({
          ...option,
          count: lodgings.filter((lodging) => getLodgingMeta(lodging).facilities.includes(option.value)).length,
        })),
      })),
    };
  }, []);

  const filteredLodgings = useMemo(() => {
    const results = lodgings.filter((lodging) => {
      const meta = getLodgingMeta(lodging);
      const priceValue = toPriceNumber(lodging.price);
      const regionMatch = region ? lodging.region.includes(region) : true;
      const regionFilterMatch = regionFilter === "all" ? true : lodging.region.includes(regionFilter);
      const typeMatch = type === "all" ? true : getLodgingTypeKey(lodging) === type;
      const priceBandMatch = matchesPriceBand(lodging, priceBand) && priceValue >= minPrice && priceValue <= maxPrice;
      const featureMatch = features.every((featureItem) => hasFeature(lodging, featureItem));
      const tasteMatch = tastes.every((value) => meta.tastes.includes(value));
      const discountMatch = discounts.every((value) => meta.discounts.includes(value));
      const gradeMatch = grades.every((value) => meta.grades.includes(value));
      const facilityMatch = facilities.every((value) => meta.facilities.includes(value));
      const availableMatch = availableOnly ? isAvailableLodging(lodging) : true;
      return regionMatch && regionFilterMatch && typeMatch && priceBandMatch && featureMatch && tasteMatch && discountMatch && gradeMatch && facilityMatch && availableMatch && matchesKeyword(lodging, keyword) && matchesTheme(lodging, theme);
    });

    if (sort === "ranking") {
      return [...results].sort((left, right) => (Number(right.rating) * 100 + reviewCountNumber(right.reviewCount)) - (Number(left.rating) * 100 + reviewCountNumber(left.reviewCount)));
    }

    if (sort === "rating") {
      return [...results].sort((left, right) => Number(right.rating) - Number(left.rating));
    }

    if (sort === "reviews") {
      return [...results].sort((left, right) => reviewCountNumber(right.reviewCount) - reviewCountNumber(left.reviewCount));
    }

    if (sort === "price_low") {
      return [...results].sort((left, right) => toPriceNumber(left.price) - toPriceNumber(right.price));
    }

    if (sort === "price_high") {
      return [...results].sort((left, right) => toPriceNumber(right.price) - toPriceNumber(left.price));
    }

    return results;
  }, [availableOnly, discounts, facilities, features, grades, keyword, maxPrice, minPrice, priceBand, region, regionFilter, sort, tastes, theme, type]);

  const [activeLodgingId, setActiveLodgingId] = useState(filteredLodgings[0]?.id ?? null);

  useEffect(() => {
    setSearchForm({ keyword, checkIn, checkOut, guests });
  }, [checkIn, checkOut, guests, keyword]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        searchShellRef.current &&
        !searchShellRef.current.contains(event.target) &&
        (!toolbarRef.current || !toolbarRef.current.contains(event.target)) &&
        (!suggestPanelRef.current || !suggestPanelRef.current.contains(event.target)) &&
        (!calendarPanelRef.current || !calendarPanelRef.current.contains(event.target)) &&
        (!guestPanelRef.current || !guestPanelRef.current.contains(event.target))
      ) {
        setActivePanel(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!filteredLodgings.length) {
      setActiveLodgingId(null);
      return;
    }

    setActiveLodgingId((current) => {
      if (current && filteredLodgings.some((lodging) => lodging.id === current)) {
        return current;
      }
      return filteredLodgings[0]?.id ?? null;
    });
  }, [filteredLodgings]);

  const focusLodging = (lodgingId) => {
    setActiveLodgingId(lodgingId);
    if (!mapInstance) return;
    const target = filteredLodgings.find((lodging) => lodging.id === lodgingId);
    if (!target) return;
    const latitude = Number(target.latitude);
    const longitude = Number(target.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    mapInstance.stop();
    mapInstance.flyTo([latitude, longitude], 11, {
      animate: true,
      duration: 0.55,
      easeLinearity: 0.25,
    });
  };

  useEffect(() => {
    if (!mapInstance || !activeLodgingId) return;
    const target = filteredLodgings.find((lodging) => lodging.id === activeLodgingId);
    if (!target) return;
    const latitude = Number(target.latitude);
    const longitude = Number(target.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    mapInstance.stop();
    mapInstance.flyTo([latitude, longitude], 11, {
      animate: true,
      duration: 0.55,
      easeLinearity: 0.25,
    });
  }, [activeLodgingId, filteredLodgings, mapInstance]);

  const updateParams = (nextValues) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === "" || value == null) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateParams(searchForm);
    setActivePanel(null);
  };

  const handleDatePick = (day) => {
    const picked = toISO(day);
    if (!searchForm.checkIn || searchForm.checkOut) {
      setSearchForm((current) => ({ ...current, checkIn: picked, checkOut: "" }));
      return;
    }
    if (picked <= searchForm.checkIn) {
      setSearchForm((current) => ({ ...current, checkIn: picked, checkOut: "" }));
      return;
    }
    setSearchForm((current) => ({ ...current, checkOut: picked }));
    setActivePanel(null);
  };

  const toggleQueryValue = (key, currentValues, value) => {
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    updateParams({ [key]: nextValues.length ? nextValues.join(",") : "" });
  };

  const handleListPointer = (event) => {
    const rawTarget = event.target;
    const baseElement =
      rawTarget instanceof Element
        ? rawTarget
        : rawTarget && rawTarget.parentElement
          ? rawTarget.parentElement
          : null;
    const target = baseElement?.closest("[data-lodging-id]");
    if (!target) return;
    const nextId = Number(target.getAttribute("data-lodging-id"));
    if (!Number.isFinite(nextId)) return;
    if (nextId === activeLodgingId) return;
    focusLodging(nextId);
  };

  return (
    <div className="container list-page">
      <section className="list-hero">
        <div>
          <p className="eyebrow">숙소 검색</p>
        </div>
      </section>

      <form ref={searchShellRef} className="list-search-bar" onSubmit={handleSearchSubmit}>
        <label
          ref={keywordRef}
          className={`list-search-field list-search-field-button${activePanel === "keyword" ? " is-active" : ""}`}
        >
          <span>숙소 검색</span>
          <input className="search-input" value={searchForm.keyword} placeholder="제주, 부산, 강릉, 서울" onFocus={() => setActivePanel("keyword")} onChange={(event) => {
            setSearchForm((current) => ({ ...current, keyword: event.target.value }));
            setActivePanel("keyword");
          }} />
        </label>
        <button
          ref={dateRef}
          type="button"
          className={`list-search-field list-search-field-button${activePanel === "date" ? " is-active" : ""}`}
          onClick={() => {
            setVisibleMonth(parseISO(searchForm.checkIn) ?? new Date());
            setActivePanel((current) => (current === "date" ? null : "date"));
          }}
        >
          <span>체크인 / 체크아웃</span>
          <strong>{formatDateSummary(searchForm.checkIn, searchForm.checkOut)}</strong>
        </button>
        <button
          ref={guestsRef}
          type="button"
          className={`list-search-field list-search-field-button${activePanel === "guests" ? " is-active" : ""}`}
          onClick={() => setActivePanel((current) => (current === "guests" ? null : "guests"))}
        >
          <span>인원</span>
          <strong>성인 {searchForm.guests}명 · 객실 1개</strong>
        </button>
        <button className="primary-button list-search-submit" type="submit">
          조건으로 숙소 찾기
        </button>
      </form>

      <SuggestionsPanel
        open={activePanel === "keyword"}
        anchorRef={keywordRef}
        panelRef={suggestPanelRef}
        items={filteredSuggestions}
        onPick={(item) => {
          setSearchForm((current) => ({ ...current, keyword: item.label }));
          setActivePanel(null);
        }}
      />

      <DateRangePopover
        open={activePanel === "date"}
        anchorRef={dateRef}
        panelRef={calendarPanelRef}
        visibleMonth={visibleMonth}
        setVisibleMonth={setVisibleMonth}
        checkIn={searchForm.checkIn}
        checkOut={searchForm.checkOut}
        onPick={handleDatePick}
        onClose={() => setActivePanel(null)}
      />

      <GuestPopover
        open={activePanel === "guests"}
        anchorRef={guestsRef}
        panelRef={guestPanelRef}
        guests={searchForm.guests}
        onChange={(next) => setSearchForm((current) => ({ ...current, guests: next }))}
        onClose={() => setActivePanel(null)}
      />

      <section className="list-toolbar">
        <div ref={toolbarRef} className="list-filter-bar">
          <div className="list-filter-menu">
            <button
              type="button"
              className={`list-filter-trigger${activeFilterMenu === "theme" ? " is-active" : ""}`}
              onClick={() => setActiveFilterMenu((current) => (current === "theme" ? null : "theme"))}
            >
              <span className="list-filter-trigger-row">
                <span className="list-filter-trigger-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M3 5h14M5.5 10h9M8 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="list-filter-trigger-copy">
                  <span>필터</span>
                  <strong>{filterSummary.length ? `${filterSummary[0]}${filterSummary.length > 1 ? ` 외 ${filterSummary.length - 1}` : ""}` : "전체"}</strong>
                </span>
              </span>
            </button>
            {activeFilterMenu === "theme" ? (
              <div className="list-filter-sheet">
                <div className="list-filter-sheet-head">
                  <strong>필터</strong>
                  <div className="list-filter-head-actions">
                    <button
                      type="button"
                      className="list-filter-reset"
                      onClick={() => updateParams({ type: "", priceBand: "", regionFilter: "", features: "", tastes: "", discounts: "", grades: "", facilities: "", minPrice: "", maxPrice: "", available: "" })}
                    >
                      초기화
                    </button>
                    <button
                      type="button"
                      className="list-filter-close"
                      onClick={() => setActiveFilterMenu(null)}
                      aria-label="필터 닫기"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="list-filter-toggle-row">
                  <span>매진 숙소 제외</span>
                  <button
                    type="button"
                    className={`list-toggle${availableOnly ? " is-on" : ""}`}
                    onClick={() => {
                      updateParams({ available: availableOnly ? "" : "1" });
                      setActiveFilterMenu(null);
                    }}
                  >
                    <span />
                  </button>
                </div>

                <div className="list-filter-section">
                  <h3>숙소유형</h3>
                  <div className="list-filter-chip-grid">
                    {optionCounts.types.filter((option) => option.count > 0).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`list-filter-option${type === option.value ? " is-selected" : ""}`}
                        onClick={() => {
                          updateParams({ type: option.value === "all" ? "" : option.value });
                          setActiveFilterMenu(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="list-filter-section">
                  <h3>예약 조건</h3>
                  <div className="list-filter-chip-grid">
                    {optionCounts.features.filter((option) => option.count > 0).map((option) => {
                      const isSelected = features.includes(option.value);
                      const nextFeatures = isSelected
                        ? features.filter((item) => item !== option.value)
                        : [...features, option.value];
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`list-filter-option${isSelected ? " is-selected" : ""}`}
                          onClick={() => {
                            updateParams({ features: nextFeatures.length ? nextFeatures.join(",") : "" });
                            setActiveFilterMenu(null);
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="list-filter-section">
                  <h3>가격대</h3>
                  <div className="list-filter-chip-grid">
                    {optionCounts.priceBands.filter((option) => option.count > 0).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`list-filter-option${priceBand === option.value ? " is-selected" : ""}`}
                        onClick={() => {
                          updateParams({ priceBand: option.value === "all" ? "" : option.value });
                          setActiveFilterMenu(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="list-filter-section">
                  <h3>지역</h3>
                  <div className="list-filter-chip-grid">
                    {optionCounts.regions.filter((option) => option.count > 0).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`list-filter-option${regionFilter === option.value ? " is-selected" : ""}`}
                        onClick={() => {
                          updateParams({ regionFilter: option.value === "all" ? "" : option.value });
                          setActiveFilterMenu(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="list-filter-section">
                  <h3>#취향</h3>
                  <div className="list-filter-chip-grid">
                    {optionCounts.tastes.filter((option) => option.count > 0).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`list-filter-option${tastes.includes(option.value) ? " is-selected" : ""}`}
                        onClick={() => toggleQueryValue("tastes", tastes, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="list-filter-section">
                  <h3>할인혜택</h3>
                  <div className="list-filter-chip-grid">
                    {optionCounts.discounts.filter((option) => option.count > 0).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`list-filter-option${discounts.includes(option.value) ? " is-selected" : ""}`}
                        onClick={() => toggleQueryValue("discounts", discounts, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="list-filter-section">
                  <h3>등급</h3>
                  <div className="list-filter-chip-grid">
                    {optionCounts.grades.filter((option) => option.count > 0).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`list-filter-option${grades.includes(option.value) ? " is-selected" : ""}`}
                        onClick={() => {
                          const nextValues = grades.includes(option.value) ? [] : [option.value];
                          updateParams({ grades: nextValues.length ? nextValues.join(",") : "" });
                          setActiveFilterMenu(null);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="list-filter-section">
                  <h3>시설</h3>
                  <div className="list-facility-groups">
                    {optionCounts.facilities.map((group) => (
                      <div key={group.title} className="list-facility-group">
                        <strong>{group.title}</strong>
                        <div className="list-filter-chip-grid">
                          {group.options.filter((option) => option.count > 0).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`list-filter-option${facilities.includes(option.value) ? " is-selected" : ""}`}
                              onClick={() => toggleQueryValue("facilities", facilities, option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="list-filter-sheet-footer">
                  <span>{filterSummary.length ? `${filterSummary.length}개 조건 적용 중` : "전체 숙소 보기"}</span>
                  <button type="button" className="primary-button list-filter-apply" onClick={() => setActiveFilterMenu(null)}>
                    적용
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="list-filter-menu">
            <button
              type="button"
              className={`list-filter-trigger${activeFilterMenu === "sort" ? " is-active" : ""}`}
              onClick={() => setActiveFilterMenu((current) => (current === "sort" ? null : "sort"))}
            >
              <span className="list-filter-trigger-row">
                <span className="list-filter-trigger-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M6 4v12m0 0-3-3m3 3 3-3M14 16V4m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="list-filter-trigger-copy">
                  <span>정렬</span>
                  <strong>{lodgingSortOptions.find((item) => item.value === sort)?.label ?? "추천순"}</strong>
                </span>
              </span>
            </button>
            {activeFilterMenu === "sort" ? (
              <div className="list-filter-popover list-filter-popover-sort">
                {lodgingSortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`list-filter-option${sort === option.value ? " is-selected" : ""}`}
                    onClick={() => {
                      updateParams({ sort: option.value });
                      setActiveFilterMenu(null);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="list-debug-bar" aria-live="polite">
        선택 숙소: {filteredLodgings.find((item) => item.id === activeLodgingId)?.name ?? "없음"} · ID {activeLodgingId ?? "null"}
      </div>

      <section className="lodging-results">
        {filteredLodgings.length === 0 ? (
          <div className="list-empty-state list-empty-state-full">
            <strong>검색 결과가 없습니다.</strong>
            <p>조건을 하나씩 해제하거나 지역, 가격대, 숙소유형을 다시 선택해보세요.</p>
          </div>
        ) : (
          <div className="lodging-results-grid">
            <div
              className="lodging-list"
              onMouseMoveCapture={handleListPointer}
              onPointerMoveCapture={handleListPointer}
              onClickCapture={handleListPointer}
            >
              {filteredLodgings.map((lodging) => (
              <article
                key={lodging.id}
                data-lodging-id={lodging.id}
                className={`lodging-compact-card${activeLodgingId === lodging.id ? " is-active" : ""}`}
                onMouseEnter={() => focusLodging(lodging.id)}
                onPointerEnter={() => focusLodging(lodging.id)}
                onMouseOver={() => focusLodging(lodging.id)}
                onMouseMove={() => focusLodging(lodging.id)}
                onPointerMove={() => focusLodging(lodging.id)}
                onFocus={() => focusLodging(lodging.id)}
                onClick={() => focusLodging(lodging.id)}
              >
                <Link
                  className="lodging-compact-visual"
                  to={`/lodgings/${lodging.id}`}
                  style={{ backgroundImage: `url(${lodging.image})` }}
                  onMouseEnter={() => focusLodging(lodging.id)}
                  onPointerEnter={() => focusLodging(lodging.id)}
                  onMouseOver={() => focusLodging(lodging.id)}
                  onMouseMove={() => focusLodging(lodging.id)}
                  onPointerMove={() => focusLodging(lodging.id)}
                  onFocus={() => focusLodging(lodging.id)}
                  onClick={() => focusLodging(lodging.id)}
                />
                <div className="lodging-compact-body">
                  {(() => {
                    const priceMeta = buildPriceMeta(lodging, filteredLodgings.findIndex((item) => item.id === lodging.id));
                    return (
                      <>
                        <strong className="lodging-compact-name">{lodging.name}</strong>
                        <div className="lodging-compact-top">
                          <span className="lodging-compact-region">
                            {lodging.region} · {lodging.district}
                            <span className="lodging-compact-review-inline">
                              ★ {lodging.rating} · 후기 {lodging.reviewCount}
                            </span>
                          </span>
                        </div>
                        <p className="lodging-compact-room">{lodging.room}</p>
                        <div className="lodging-compact-bottom">
                          <div className="lodging-compact-price-stack">
                            {priceMeta.discount ? (
                              <div className="lodging-compact-price-top">
                                <span className="lodging-compact-discount">{priceMeta.discount}</span>
                                <span className="lodging-compact-original">{priceMeta.original}</span>
                              </div>
                            ) : null}
                            <div className="lodging-compact-price">
                              <strong>{priceMeta.current}</strong>
                              <span>/ 1박</span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </article>
              ))}
            </div>

            <aside className="map-preview">
              <div className="stay-map-wrap">
                <MapContainer
                  center={[
                    filteredLodgings.reduce((sum, item) => sum + Number(item.latitude), 0) / filteredLodgings.length,
                    filteredLodgings.reduce((sum, item) => sum + Number(item.longitude), 0) / filteredLodgings.length,
                  ]}
                  zoom={6.4}
                  scrollWheelZoom
                  style={{ width: "100%", height: "100%" }}
                  zoomControl={false}
                  whenReady={(event) => setMapInstance(event.target)}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                  />
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                  />
                  {filteredLodgings.map((lodging) => (
                    <Marker
                      key={lodging.id}
                      position={[Number(lodging.latitude), Number(lodging.longitude)]}
                      icon={buildPriceMarkerIcon(lodging.price, activeLodgingId === lodging.id)}
                      zIndexOffset={activeLodgingId === lodging.id ? 200 : 0}
                      eventHandlers={{
                        click: () => focusLodging(lodging.id),
                      }}
                    >
                      <Popup>
                        <strong>{lodging.name}</strong>
                        <br />
                        {lodging.region} · {lodging.district}
                        <br />
                        {lodging.price}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                <div className="stay-map-controls">
                  <button type="button" className="stay-map-control" onClick={() => mapInstance?.zoomIn()} aria-label="지도 확대">+</button>
                  <button type="button" className="stay-map-control" onClick={() => mapInstance?.zoomOut()} aria-label="지도 축소">-</button>
                  <button
                    type="button"
                    className="stay-map-control"
                    onClick={() => {
                      if (!mapInstance || !filteredLodgings.length) return;
                      const center = [
                        filteredLodgings.reduce((sum, item) => sum + Number(item.latitude), 0) / filteredLodgings.length,
                        filteredLodgings.reduce((sum, item) => sum + Number(item.longitude), 0) / filteredLodgings.length,
                      ];
                      mapInstance.setView(center, 6.4);
                    }}
                    aria-label="지도 재중앙"
                  >
                    ⌖
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
