const API_BASE_URL = "http://100.96.110.114:8080";
const APP_DATA_SOURCE = "http";

export function getAppDataSource() {
  return APP_DATA_SOURCE;
}

export function isMockDataSource() {
  return APP_DATA_SOURCE === "mock";
}

export function assertMockDataSource() {
  if (!isMockDataSource()) {
    throw new Error("Mock data source is not configured.");
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorPayload = await response.json();
      errorMessage = errorPayload.msg || errorPayload.message || errorMessage;
    } catch {
      // Ignore JSON parse errors and keep the fallback message.
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function get(path, options = {}) {
  return request(path, {
    method: "GET",
    ...options,
  });
}

export function post(path, body, options = {}) {
  return request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: JSON.stringify(body),
    ...options,
  });
}
