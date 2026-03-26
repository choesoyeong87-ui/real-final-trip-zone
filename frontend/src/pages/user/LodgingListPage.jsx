import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { homeSearchDefaults } from "../../data/homeData";
import { lodgingSortOptions } from "../../data/lodgingData";
import { DateRangePopover, GuestPopover, SuggestionsPanel } from "../../features/lodging-list/LodgingSearchPanels";
import { LodgingListToolbar } from "../../features/lodging-list/LodgingListToolbar";
import { LodgingResultsLayout } from "../../features/lodging-list/LodgingResultsLayout";
import {
  buildOptionCounts,
  buildSuggestionItems,
  buildFilterSummary,
  filterLodgings,
  filterSuggestions,
  parseLodgingSearchState,
} from "../../features/lodging-list/lodgingListViewModel";
import { clamp, formatDateSummary, parseISO, toISO } from "../../features/lodging-list/lodgingListUtils";
import { getLodgings, getSearchSuggestionItems } from "../../services/lodgingService";

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
  const lodgings = useMemo(() => getLodgings(), []);
  const searchSuggestionItems = useMemo(() => getSearchSuggestionItems(), []);
  const filters = parseLodgingSearchState(searchParams, homeSearchDefaults);
  const keyword = filters.keyword;
  const checkIn = filters.checkIn;
  const checkOut = filters.checkOut;
  const guests = filters.guests;
  const sort = filters.sort;
  const type = filters.type;
  const priceBand = filters.priceBand;
  const regionFilter = filters.regionFilter;
  const features = filters.features;
  const tastes = filters.tastes;
  const discounts = filters.discounts;
  const grades = filters.grades;
  const facilities = filters.facilities;
  const minPrice = clamp(filters.minPrice, 0, 500000);
  const maxPrice = clamp(filters.maxPrice, minPrice, 500000);
  const availableOnly = filters.availableOnly;

  const [searchForm, setSearchForm] = useState({
    keyword,
    checkIn,
    checkOut,
    guests,
  });
  const [activePanel, setActivePanel] = useState(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(parseISO(checkIn) ?? new Date());
  const filterSummary = buildFilterSummary(filters, lodgingSortOptions);

  const allSuggestionItems = useMemo(() => {
    return buildSuggestionItems(lodgings, searchSuggestionItems);
  }, [lodgings, searchSuggestionItems]);

  const filteredSuggestions = useMemo(() => {
    return filterSuggestions(allSuggestionItems, searchForm.keyword);
  }, [allSuggestionItems, searchForm.keyword]);

  const optionCounts = useMemo(() => {
    return buildOptionCounts(lodgings);
  }, [lodgings]);

  const filteredLodgings = useMemo(() => {
    return filterLodgings(lodgings, { ...filters, minPrice, maxPrice });
  }, [filters, maxPrice, minPrice]);

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

      <LodgingListToolbar
        toolbarRef={toolbarRef}
        activeFilterMenu={activeFilterMenu}
        setActiveFilterMenu={setActiveFilterMenu}
        filterSummary={filterSummary}
        updateParams={updateParams}
        availableOnly={availableOnly}
        optionCounts={optionCounts}
        type={type}
        features={features}
        priceBand={priceBand}
        regionFilter={regionFilter}
        tastes={tastes}
        discounts={discounts}
        grades={grades}
        facilities={facilities}
        toggleQueryValue={toggleQueryValue}
        lodgingSortOptions={lodgingSortOptions}
        sort={sort}
      />

      <div className="list-debug-bar" aria-live="polite">
        선택 숙소: {filteredLodgings.find((item) => item.id === activeLodgingId)?.name ?? "없음"} · ID {activeLodgingId ?? "null"}
      </div>

      <LodgingResultsLayout
        filteredLodgings={filteredLodgings}
        activeLodgingId={activeLodgingId}
        focusLodging={focusLodging}
        handleListPointer={handleListPointer}
        mapInstance={mapInstance}
        setMapInstance={setMapInstance}
      />
    </div>
  );
}
