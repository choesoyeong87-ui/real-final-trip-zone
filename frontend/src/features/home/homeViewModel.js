import { matchesKeyword } from "./homeUtils";

const RECENT_SEARCHES_KEY = "tripzone-recent-searches";

export function buildHomeSuggestionItems(lodgings, searchSuggestionItems) {
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
}

export function filterHomeSuggestions(items, keyword) {
  const term = keyword.trim();
  if (!term) return [];
  return items.filter((item) => matchesKeyword(item, term)).slice(0, 8);
}

export function readRecentSearches() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.slice(0, 4) : [];
  } catch {
    return [];
  }
}

export function writeRecentSearches(keyword, recentSearches) {
  const trimmed = keyword.trim();
  if (!trimmed) return recentSearches;
  const nextRecent = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, 4);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecent));
  return nextRecent;
}
