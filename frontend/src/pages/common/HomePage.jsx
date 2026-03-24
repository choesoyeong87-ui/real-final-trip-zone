import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  destinationStats,
  homeSearchDefaults,
  lodgingCollections,
  lodgings,
  promoBanners,
  searchSuggestionItems,
} from "../../data/siteData";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const SEARCH_TABS = [{ key: "domestic", label: "국내숙소", placeholder: "제주, 부산, 강릉, 서울" }];

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

function matchesKeyword(item, keyword) {
  const term = normalizeText(keyword);
  if (!term) return false;

  const fields = [item.label, item.subtitle, item.region, ...(item.aliases ?? [])]
    .filter(Boolean)
    .map((field) => normalizeText(field));
  const initialFields = [item.label, item.subtitle, item.region, ...(item.aliases ?? [])]
    .filter(Boolean)
    .map((field) => getInitialConsonants(field));

  return fields.some((field) => field.includes(term)) || initialFields.some((field) => field.includes(term));
}

function computePosition(anchorRect, wantedWidth, wantedHeight, options = {}) {
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

function buildCollectionCards(collection) {
  const base = collection.ids
    .map((id) => lodgings.find((item) => item.id === id))
    .filter(Boolean);

  return Array.from({ length: 4 }, (_, index) => {
    const lodging = base[index % base.length];
    const currentPrice = Number(String(lodging.price).replace(/[^\d]/g, ""));
    const rateSeed = [0, 0.08, 0.11, 0.14, 0.17][(lodging.id + index) % 5];
    const hasDiscount = (lodging.id + index) % 4 !== 0;
    const originalPrice = hasDiscount
      ? Math.round((currentPrice / (1 - rateSeed)) / 1000) * 1000
      : currentPrice;
    const discountRate = hasDiscount ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;
    return {
      ...lodging,
      key: `${collection.region}-${lodging.id}-${index}`,
      benefit: index % 2 === 0 ? lodging.benefit : lodging.highlights[index % lodging.highlights.length],
      originalPrice: hasDiscount ? `${originalPrice.toLocaleString()}원` : "",
      discountRate: hasDiscount ? `${discountRate}%` : "",
    };
  });
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

          if (!isCurrentMonth) {
            return <span key={toISO(day)} className="calendar-day-placeholder" aria-hidden="true" />;
          }

          return (
            <button
              key={toISO(day)}
              type="button"
              className={`calendar-day${isStart ? " is-start" : ""}${isEnd ? " is-end" : ""}${isBetween ? " is-between" : ""}`}
              onClick={() => onPick(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuggestionsPanel({ open, anchorRef, panelRef, recentSearches, filteredSuggestions, keyword, suggestionIcon, activeSuggest, onHoverSuggestion, onPickRecent, onPickSuggestion }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const wantedWidth = clamp(Math.max(rect.width, 420), 420, 520);
      const next = computePosition(rect, wantedWidth, 340);
      setPosition({
        left: next.left,
        top: next.top,
        width: wantedWidth,
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
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        maxHeight: `${position.maxHeight}px`,
      }}
    >
      <div className="search-suggestion-group">
        <span className="search-chip-label">연관 검색</span>
        <div className="search-suggestion-list search-suggestion-list-stacked">
          {filteredSuggestions.map((item) => (
            <button
              key={`${item.type}-${item.label}`}
              type="button"
              className={`search-suggestion-item${filteredSuggestions[activeSuggest] === item ? " is-active" : ""}`}
              onMouseEnter={() => onHoverSuggestion(filteredSuggestions.findIndex((candidate) => candidate === item))}
              onClick={() => onPickSuggestion(item)}
            >
              <span className="search-suggestion-icon">{suggestionIcon[item.type] ?? "●"}</span>
              <div className="search-suggestion-copy">
                <strong>{item.label}</strong>
                <span>{item.subtitle}</span>
              </div>
            </button>
          ))}
          {!filteredSuggestions.length ? (
            <div className="search-empty-state">{keyword.trim() ? "연관 검색 결과가 없습니다." : "지역, 역, 숙소명을 입력해보세요."}</div>
          ) : null}
        </div>
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
      const wantedWidth = clamp(Math.max(rect.width, 320), 280, 360);
      const next = computePosition(rect, wantedWidth, 156);
      setPosition({
        left: next.left,
        top: next.top,
        width: wantedWidth,
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
      className="search-floating-panel guest-panel"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
      }}
    >
      <div className="guest-panel-row">
        <div>
          <strong>성인</strong>
          <span>객실 1개 기준</span>
        </div>
        <div className="guest-stepper">
          <button
            type="button"
            className="guest-stepper-button"
            onClick={() => onChange(String(Math.max(1, Number(guests) - 1)))}
          >
            -
          </button>
          <strong>{guests}</strong>
          <button
            type="button"
            className="guest-stepper-button"
            onClick={() => onChange(String(Math.min(8, Number(guests) + 1)))}
          >
            +
          </button>
        </div>
      </div>
      <button type="button" className="primary-button search-flyout-confirm" onClick={onClose}>
        인원 선택 완료
      </button>
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
      const wantedWidth = isMobile ? Math.min(window.innerWidth - 24, 420) : Math.min(window.innerWidth - 24, 640);
      const next = computePosition(rect, wantedWidth, isMobile ? 540 : 500, { preferBelow: true });
      setPosition({
        left: next.left,
        top: next.top,
        width: wantedWidth,
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
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
        maxHeight: `${position.maxHeight}px`,
      }}
    >
      <div className="calendar-toolbar">
        <button type="button" className="calendar-nav" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
          이전
        </button>
        <button type="button" className="calendar-nav" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
          다음
        </button>
      </div>
      <div className="calendar-month-grid" style={{ gridTemplateColumns: position.isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        <CalendarMonth baseDate={visibleMonth} startDate={startDate} endDate={endDate} onPick={onPick} />
        {!position.isMobile ? (
          <CalendarMonth
            baseDate={new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)}
            startDate={startDate}
            endDate={endDate}
            onPick={onPick}
          />
        ) : null}
      </div>
      <div className="calendar-footer">
        <span className="calendar-footer-text">{formatDateSummary(checkIn, checkOut)}</span>
        <button type="button" className="primary-button calendar-apply-button" onClick={onClose}>
          적용
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const searchShellRef = useRef(null);
  const keywordRef = useRef(null);
  const dateRef = useRef(null);
  const guestsRef = useRef(null);
  const suggestPanelRef = useRef(null);
  const calendarPanelRef = useRef(null);
  const guestPanelRef = useRef(null);
  const [searchForm, setSearchForm] = useState(homeSearchDefaults);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [activeSuggest, setActiveSuggest] = useState(0);
  const [activeTab, setActiveTab] = useState("domestic");
  const [visibleMonth, setVisibleMonth] = useState(parseISO(homeSearchDefaults.checkIn) ?? new Date());
  const currentTab = SEARCH_TABS.find((tab) => tab.key === activeTab) ?? SEARCH_TABS[0];

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
    ]);

    const merged = [...searchSuggestionItems, ...lodgingItems];
    const unique = new Map();
    merged.forEach((item) => {
      const key = `${item.type}-${item.label}-${item.subtitle}`;
      if (!unique.has(key)) unique.set(key, item);
    });
    return Array.from(unique.values());
  }, []);

  const startDate = parseISO(searchForm.checkIn);
  const endDate = parseISO(searchForm.checkOut);

  const filteredSuggestions = useMemo(() => {
    const keyword = searchForm.keyword.trim();
    if (!keyword) return [];
    return allSuggestionItems
      .filter((item) => matchesKeyword(item, keyword))
      .slice(0, 8);
  }, [allSuggestionItems, searchForm.keyword]);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("tripzone-recent-searches") ?? "[]");
      setRecentSearches(Array.isArray(stored) ? stored.slice(0, 4) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    setActiveSuggest(0);
  }, [searchForm.keyword]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        searchShellRef.current &&
        !searchShellRef.current.contains(event.target) &&
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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (searchForm.keyword.trim()) params.set("keyword", searchForm.keyword.trim());
    if (searchForm.checkIn) params.set("checkIn", searchForm.checkIn);
    if (searchForm.checkOut) params.set("checkOut", searchForm.checkOut);
    if (searchForm.guests) params.set("guests", searchForm.guests);
    if (activeTab !== "domestic") params.set("tab", activeTab);
    if (searchForm.keyword.trim()) {
      const nextRecent = [searchForm.keyword.trim(), ...recentSearches.filter((item) => item !== searchForm.keyword.trim())].slice(0, 4);
      setRecentSearches(nextRecent);
      window.localStorage.setItem("tripzone-recent-searches", JSON.stringify(nextRecent));
    }
    navigate(`/lodgings?${params.toString()}`);
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

  const handleKeywordKeyDown = (event) => {
    if (activePanel !== "keyword" || !filteredSuggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggest((current) => (current + 1) % filteredSuggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggest((current) => (current - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const picked = filteredSuggestions[activeSuggest];
      if (!picked) return;
      setSearchForm((current) => ({ ...current, keyword: picked.label }));
      setActivePanel(null);
    }

    if (event.key === "Escape") {
      setActivePanel(null);
    }
  };

  const suggestionIcon = {
    region: "●",
    hotel: "■",
    station: "◆",
  };

  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="home-hero-backdrop" />
        <div className="home-hero-overlay" />
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <div className="home-hero-brand">TripZone</div>
            <h1>오늘 바로 예약 가능한 국내 숙소</h1>
            <p>숙소 검색부터 예약, 결제, 문의까지 이어지는 국내 숙소 예약 메인입니다.</p>
            <div className="hero-actions">
              <Link className="primary-button" to="/lodgings">
                숙소 검색하기
              </Link>
              <Link className="secondary-button hero-secondary" to="/events">
                오늘 특가 보기
              </Link>
            </div>
            <div className="hero-stat-row">
              {destinationStats.map((item) => (
                <div key={item.label} className="hero-stat-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <form
            ref={searchShellRef}
            className="search-panel search-panel-classic"
            onSubmit={handleSearchSubmit}
          >
            <div className="search-classic-stack">
              <label
                ref={keywordRef}
                className={`search-field search-field-button search-field-keyword${activePanel === "keyword" ? " is-active" : ""}`}
              >
                <span>숙소 검색</span>
                <input
                  className="search-input"
                  value={searchForm.keyword}
                  placeholder={currentTab.placeholder}
                  onFocus={() => setActivePanel("keyword")}
                  onKeyDown={handleKeywordKeyDown}
                  onChange={(event) => {
                    setSearchForm((current) => ({ ...current, keyword: event.target.value }));
                    setActivePanel("keyword");
                  }}
                />
              </label>

              <button
                ref={dateRef}
                type="button"
                className={`search-field search-field-button${activePanel === "date" ? " is-active" : ""}`}
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
                className={`search-field search-field-button${activePanel === "guests" ? " is-active" : ""}`}
                onClick={() => setActivePanel((current) => (current === "guests" ? null : "guests"))}
              >
                <span>인원</span>
                <strong>성인 {searchForm.guests}명 · 객실 1개</strong>
              </button>
            </div>

            <button className="primary-button search-submit" type="submit">
              조건으로 숙소 찾기
            </button>
          </form>

          <SuggestionsPanel
            open={activePanel === "keyword"}
            anchorRef={keywordRef}
            panelRef={suggestPanelRef}
            recentSearches={recentSearches}
            filteredSuggestions={filteredSuggestions}
            keyword={searchForm.keyword}
            suggestionIcon={suggestionIcon}
            activeSuggest={activeSuggest}
            onHoverSuggestion={setActiveSuggest}
            onPickRecent={(item) => {
              setSearchForm((current) => ({ ...current, keyword: item }));
              setActivePanel(null);
            }}
            onPickSuggestion={(item) => {
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
        </div>
      </section>

      <div className="container home-content">
        <section className="home-section">
          <div className="home-section-head">
            <h2>지금 예약이 빠른 특가</h2>
            <Link className="text-link" to="/events">
              이벤트 전체 보기
            </Link>
          </div>
          <div className="promo-grid">
            {promoBanners.map((item) => (
              <article
                key={item.title}
                className={`promo-card promo-${item.accent}`}
                style={{ backgroundImage: `linear-gradient(180deg, rgba(8, 24, 34, 0.12), rgba(8, 24, 34, 0.58)), url(${item.image})` }}
              >
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
                <span className="promo-date">{item.date}</span>
              </article>
            ))}
          </div>
        </section>

        {lodgingCollections.map((collection) => (
          <section key={collection.title} className="home-section">
            <div className="home-section-head">
              <h2>{collection.title}</h2>
              <Link className="text-link" to={`/lodgings?region=${collection.region}`}>
                지역 전체 보기
              </Link>
            </div>
            <div className="lodging-showcase">
              {buildCollectionCards(collection).map((lodging) => (
                <Link key={lodging.key} className="showcase-row" to={`/lodgings/${lodging.id}`}>
                  <div className="rail-card-visual" style={{ backgroundImage: `url(${lodging.image})` }} />
                  <div className="showcase-copy">
                    <strong>{lodging.name}</strong>
                    <div className="showcase-kicker">
                      {lodging.region} · {lodging.district}
                      <span className="showcase-review-inline">
                        ★ {lodging.rating} · {lodging.reviewCount}
                      </span>
                    </div>
                    <p className="showcase-room-meta">{lodging.room}</p>
                    <div className="showcase-foot">
                      <div className="showcase-price-stack">
                        <div className="showcase-price-top">
                          <span className="showcase-discount">{lodging.discountRate}</span>
                          <span className="showcase-original-price">{lodging.originalPrice}</span>
                        </div>
                        <span className="showcase-price">{lodging.price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
