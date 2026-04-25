/**
 * background.js - cache only, no fetching
 */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SAVE_CACHE') {
    chrome.storage.local.set({ cache: msg.payload });
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === 'GET_CACHE') {
    chrome.storage.local.get('cache', r => sendResponse(r.cache || null));
    return true;
  }
});
