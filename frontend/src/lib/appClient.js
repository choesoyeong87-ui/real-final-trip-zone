const APP_DATA_SOURCE = "mock";

export function getAppDataSource() {
  return APP_DATA_SOURCE;
}

export function isMockDataSource() {
  return APP_DATA_SOURCE === "mock";
}

export function assertMockDataSource() {
  if (!isMockDataSource()) {
    throw new Error("HTTP data source is not configured yet.");
  }
}
