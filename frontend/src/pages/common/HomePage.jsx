import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { homeSearchDefaults } from "../../data/homeData";
import { DateRangePopover, GuestPopover, SuggestionsPanel } from "../../features/home/HomeSearchPanels";
import { SUGGESTION_ICON } from "../../features/home/homeConstants";
import { formatDateSummary, parseISO, toISO } from "../../features/home/homeUtils";
import {
  buildHomeSuggestionItems,
  filterHomeSuggestions,
  readRecentSearches,
  writeRecentSearches,
} from "../../features/home/homeViewModel";
import { getCachedLodgingsSnapshot, getLodgings, getSearchSuggestionItems, subscribeLodgingsInvalidated } from "../../services/lodgingService";

export default function HomePage() {
  const location = useLocation();
  const cachedLodgings = getCachedLodgingsSnapshot();
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
  const [activeTab] = useState("domestic");
  const [visibleMonth, setVisibleMonth] = useState(parseISO(homeSearchDefaults.checkIn) ?? new Date());
  const [lodgings, setLodgings] = useState(cachedLodgings);
  const [lodgingsLoading, setLodgingsLoading] = useState(cachedLodgings.length === 0);
  const [searchSuggestionItems, setSearchSuggestionItems] = useState([]);
  const heroShortcuts = useMemo(
    () => [
      {
        label: "숙소 탐색",
        to: "/lodgings",
        active: location.pathname.startsWith("/lodgings") && !location.search.includes("theme=deal"),
      },
      {
        label: "오늘 특가",
        to: "/events",
        active: location.pathname === "/events",
      },
      {
        label: "예약 내역",
        to: "/my/bookings",
        active: location.pathname.startsWith("/my/bookings"),
      },
    ],
    [location.pathname, location.search],
  );
  const heroStats = useMemo(() => {
    const activeCount = lodgings.filter((item) => item.status === "ACTIVE").length;
    const reviewTotal = lodgings.reduce((total, item) => {
      const count = Number(String(item.reviewCount ?? "").replace(/[^\d]/g, ""));
      return total + (Number.isFinite(count) ? count : 0);
    }, 0);
    const regions = new Set(lodgings.map((item) => item.region).filter(Boolean));

    return [
      { label: "예약 가능 숙소", value: `${activeCount || lodgings.length || 18}+`, numericValue: activeCount || lodgings.length || 18, suffix: "+" },
      { label: "인기 지역", value: `${regions.size || 8}`, numericValue: regions.size || 8, suffix: "" },
      { label: "누적 후기", value: `${reviewTotal || 1200}+`, numericValue: reviewTotal || 1200, suffix: "+" },
    ];
  }, [lodgings]);
  const [animatedHeroStats, setAnimatedHeroStats] = useState(() => heroStats.map((item) => item.value));

  const allSuggestionItems = useMemo(
    () => buildHomeSuggestionItems(lodgings, searchSuggestionItems),
    [lodgings, searchSuggestionItems],
  );
  const filteredSuggestions = useMemo(() => filterHomeSuggestions(allSuggestionItems, searchForm.keyword), [allSuggestionItems, searchForm.keyword]);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    document.body.classList.add("home-page-active");
    return () => {
      document.body.classList.remove("home-page-active");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      try {
        const nextLodgings = await getLodgings();
        const nextSuggestions = await getSearchSuggestionItems(nextLodgings);

        if (cancelled) return;
        setLodgings(nextLodgings);
        setLodgingsLoading(false);
        setSearchSuggestionItems(nextSuggestions);
      } catch (error) {
        console.error("Failed to load home lodging data.", error);
      }
    }

    loadHomeData();

    const unsubscribe = subscribeLodgingsInvalidated(() => {
      loadHomeData();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setActiveSuggest(0);
  }, [searchForm.keyword]);

  useEffect(() => {
    if (lodgingsLoading) return;

    let frameId = 0;
    const startedAt = performance.now();
    const duration = 1100;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);

      setAnimatedHeroStats(
        heroStats.map((item) => `${Math.round(item.numericValue * eased)}${item.suffix}`),
      );

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      setAnimatedHeroStats(heroStats.map((item) => item.value));
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [heroStats, lodgingsLoading]);

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
      const nextRecent = writeRecentSearches(searchForm.keyword, recentSearches);
      setRecentSearches(nextRecent);
    }
    navigate(`/lodgings?${params.toString()}`);
  };

  const updateSearchGlow = (event) => {
    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();
    currentTarget.style.setProperty("--search-glow-x", `${clientX - rect.left}px`);
    currentTarget.style.setProperty("--search-glow-y", `${clientY - rect.top}px`);
  };

  const resetSearchGlow = () => {
    if (!searchShellRef.current) return;
    searchShellRef.current.style.setProperty("--search-glow-x", "50%");
    searchShellRef.current.style.setProperty("--search-glow-y", "50%");
  };

  const handleDatePick = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (day < today) return;

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

  return (
    <div className="home-shell">
      <section className="home-rebuild-stage home-rebuild-viewport">
        <div className="home-rebuild-shell">
          <div className="home-rebuild-copy">
            <h1>
              일정에 맞는 국내 숙소를
              <span className="home-rebuild-headline-break">찾아보세요.</span>
            </h1>
          </div>

          <form
            ref={searchShellRef}
            className="home-rebuild-search-strip"
            onSubmit={handleSearchSubmit}
            onMouseMove={updateSearchGlow}
            onMouseLeave={resetSearchGlow}
          >
            <label
              ref={keywordRef}
              className={`home-rebuild-search-field${activePanel === "keyword" ? " is-active" : ""}`}
            >
              <span>지역</span>
              <input
                className="home-rebuild-search-input"
                value={searchForm.keyword}
                placeholder="지역명 또는 숙소명을 입력하세요"
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
              className={`home-rebuild-search-field${activePanel === "date" ? " is-active" : ""}`}
              onClick={() => {
                setVisibleMonth(parseISO(searchForm.checkIn) ?? new Date());
                setActivePanel((current) => (current === "date" ? null : "date"));
              }}
            >
              <span>일정</span>
              <strong>{formatDateSummary(searchForm.checkIn, searchForm.checkOut)}</strong>
            </button>

            <button
              ref={guestsRef}
              type="button"
              className={`home-rebuild-search-field${activePanel === "guests" ? " is-active" : ""}`}
              onClick={() => setActivePanel((current) => (current === "guests" ? null : "guests"))}
            >
              <span>인원</span>
              <strong>성인 {searchForm.guests}명 · 객실 1개</strong>
            </button>

            <button className="home-rebuild-search-submit" type="submit">
              검색
            </button>
          </form>

          <div className="home-rebuild-shortcut-row" aria-label="홈 빠른 이동">
            {heroShortcuts.map((item) => (
              <Link key={item.label} className={`home-rebuild-shortcut-link${item.active ? " is-active" : ""}`} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="home-rebuild-stat-row" aria-label="홈 요약 지표">
            {heroStats.map((item, index) => (
              <div key={item.label} className="home-rebuild-stat-card">
                <strong>{lodgingsLoading ? "—" : animatedHeroStats[index] ?? item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <SuggestionsPanel
            open={activePanel === "keyword"}
            anchorRef={keywordRef}
            panelRef={suggestPanelRef}
            recentSearches={recentSearches}
            filteredSuggestions={filteredSuggestions}
            keyword={searchForm.keyword}
            suggestionIcon={SUGGESTION_ICON}
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
    </div>
  );
}
