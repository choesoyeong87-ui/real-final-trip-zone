import { lodgingReviews } from "../data/lodgingDetailData";
import { lodgingCollections, lodgings, searchSuggestionItems } from "../data/lodgingData";

// Current backend note:
// /api/lodgings/list, lodgingNo, lodgingName, lodgingType.
// Keep UI-facing shape stable here and map backend DTOs in this service.

export function getLodgings() {
  return lodgings;
}

export function getLodgingById(lodgingId) {
  return lodgings.find((item) => String(item.id) === String(lodgingId)) ?? lodgings[0] ?? null;
}

export function getLodgingCollections() {
  return lodgingCollections;
}

export function getSearchSuggestionItems() {
  return searchSuggestionItems;
}

export function getLodgingReviews() {
  return lodgingReviews;
}
