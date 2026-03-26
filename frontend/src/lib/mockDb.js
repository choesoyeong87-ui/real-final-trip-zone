function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCollection(key, seedRows) {
  if (!canUseStorage()) return seedRows;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return seedRows;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedRows;
  } catch {
    return seedRows;
  }
}

export function writeCollection(key, rows) {
  if (!canUseStorage()) return rows;
  window.localStorage.setItem(key, JSON.stringify(rows));
  return rows;
}

export function updateCollectionRow(key, seedRows, matcher, patch) {
  const rows = readCollection(key, seedRows);
  const nextRows = rows.map((row) => (matcher(row) ? { ...row, ...patch } : row));
  writeCollection(key, nextRows);
  return nextRows;
}

export function replaceCollectionRow(key, seedRows, matcher, nextRow) {
  const rows = readCollection(key, seedRows);
  const nextRows = rows.map((row) => (matcher(row) ? nextRow : row));
  writeCollection(key, nextRows);
  return nextRows;
}
