/**
 * content.js
 * Runs inside claude.ai — same origin, so credentials attach automatically.
 *
 * Two jobs:
 *  1. Sniff the org ID from the page (URL or localStorage)
 *  2. Fetch /api/organizations/{orgId}/usage and return the data
 */

function getOrgId() {
  // Try URL first: claude.ai/chat, settings, etc. often have org in path or stored
  // claude.ai stores lastActiveOrg in cookies and also in the page context
  const fromCookie = document.cookie.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('lastActiveOrg='));
  if (fromCookie) return fromCookie.split('=')[1];

  // Try localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const val = localStorage.getItem(key) || '';
    if (val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      if (key.toLowerCase().includes('org')) return val;
    }
    try {
      const parsed = JSON.parse(val);
      if (parsed?.orgId) return parsed.orgId;
      if (parsed?.organizationId) return parsed.organizationId;
      if (parsed?.org_id) return parsed.org_id;
    } catch {}
  }

  // Try window.__NEXT_DATA__ or similar SSR data
  try {
    const nextData = window.__NEXT_DATA__;
    if (nextData?.props?.pageProps?.organizationId) return nextData.props.pageProps.organizationId;
    if (nextData?.props?.pageProps?.orgId) return nextData.props.pageProps.orgId;
  } catch {}

  return null;
}

async function fetchUsage(orgId) {
  const url = `https://claude.ai/api/organizations/${orgId}/usage`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'accept': '*/*',
      'content-type': 'application/json',
      'anthropic-client-platform': 'web_claude_ai',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FETCH_USAGE') {
    (async () => {
      try {
        // Use org ID from message (popup passes stored one) or sniff from page
        const orgId = msg.orgId || getOrgId();
        if (!orgId) {
          sendResponse({ error: 'NO_ORG_ID' });
          return;
        }
        const data = await fetchUsage(orgId);
        sendResponse({ data, orgId, fetchedAt: Date.now() });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }
});
