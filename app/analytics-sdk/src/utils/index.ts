
/**
 * Generate a random UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a persistent visitor ID
 */
export function getVisitorId(): string {
  const KEY = 'analytics_uuid';
  let uuid = localStorage.getItem(KEY);
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem(KEY, uuid);
  }
  return uuid;
}

/**
 * Send data via Beacon or Fetch
 */
export function sendRequest(url: string, data: any): void {
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json; charset=UTF-8',
  });
  
  // Use sendBeacon if available
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, blob);
  } else {
    // Fallback to fetch (keepalive if possible)
    fetch(url, {
      method: 'POST',
      body: blob,
      keepalive: true,
    }).catch((err) => console.error('Analytics Report Error:', err));
  }
}
