/**
 * popup.js
 * 1. Gets org ID from cache or asks content script to sniff it
 * 2. Asks content script (running on claude.ai tab) to fetch usage
 * 3. Renders vikkiverse UI
 */

const $ = id => document.getElementById(id);
const body     = $('body-content');
const dot      = $('statusDot');
const refreshBtn = $('refreshBtn');
const footer   = $('footerTime');

/* ── utils ── */
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
function formatReset(iso) {
  if (!iso) return null;
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return 'resetting…';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h ${m % 60}m`;
  return `in ${Math.floor(h / 24)}d`;
}
function pctClass(p) {
  return p >= 85 ? 'warn' : p >= 60 ? 'mid' : '';
}

/* ── render helpers ── */
function shimmer() {
  body.innerHTML = `
    <div class="shimmer tall"></div>
    <div class="shimmer" style="width:100%"></div>
    <div class="shimmer" style="width:75%;margin-top:-8px"></div>
    <div class="shimmer" style="width:100%;margin-top:10px"></div>
    <div class="shimmer" style="width:60%;margin-top:-8px"></div>`;
}

function showState(icon, title, sub, btnLabel, btnAction) {
  dot.className = 'dot dot-err';
  body.innerHTML = `
    <div class="state-box">
      ${icon}
      <div class="state-title">${title}</div>
      <div class="state-sub">${sub}</div>
      ${btnLabel ? `<button class="cta-btn" id="stateBtn">${btnLabel}</button>` : ''}
    </div>`;
  if (btnLabel && btnAction) $('stateBtn').onclick = btnAction;
}

function rowHTML(label, obj) {
  if (!obj) return `
    <div class="null-row">
      <span class="null-label">${label}</span>
      <span class="null-badge">INACTIVE</span>
    </div>`;
  const p   = Math.round(obj.utilization ?? obj.percent ?? 0);
  const cls = pctClass(p);
  const rst = formatReset(obj.resets_at ?? obj.reset_at);
  return `
    <div class="usage-row">
      <div class="row-meta">
        <span class="row-label">${label}</span>
        <span class="row-pct ${cls}">${p}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${p}%"></div></div>
      ${rst ? `<div class="row-reset">Resets <span>${rst}</span></div>` : ''}
    </div>`;
}

function renderData(data, ts) {
  dot.className = 'dot dot-ok';
  footer.textContent = `Updated ${timeAgo(ts)}`;

  // The claude.ai endpoint returns an array or object — handle both
  let rows = [];

  if (Array.isArray(data)) {
    // Array of usage objects
    rows = data.map(item => ({
      label: item.model ?? item.type ?? item.window ?? item.name ?? 'Usage',
      obj: {
        utilization: item.percent ?? (item.limit > 0 ? (item.used / item.limit) * 100 : 0),
        resets_at: item.resets_at ?? item.reset_at ?? item.expires_at,
      }
    }));
  } else if (data && typeof data === 'object') {
    // Named keys like five_hour, seven_day — same shape as oauth/usage
    const keyMap = {
      five_hour:     '5-hour window',
      seven_day:     '7-day window',
      seven_day_opus:'7-day Opus',
      extra_usage:   'Extra usage',
    };
    Object.entries(keyMap).forEach(([k, label]) => {
      if (data[k]) rows.push({ label, obj: data[k] });
    });

    // Fallback: any key with utilization or percent
    if (!rows.length) {
      Object.entries(data).forEach(([k, v]) => {
        if (v && typeof v === 'object' && ('utilization' in v || 'percent' in v)) {
          rows.push({ label: k.replace(/_/g, ' '), obj: v });
        }
      });
    }
  }

  if (!rows.length) {
    // Show raw JSON if we can't parse it
    body.innerHTML = `
      <div class="eyebrow">Raw response</div>
      <pre class="raw-json">${JSON.stringify(data, null, 2)}</pre>`;
    return;
  }

  const active   = rows.filter(r => r.obj);
  const inactive = rows.filter(r => !r.obj);
  let html = `<div class="eyebrow">Usage limits</div>`;
  active.forEach((r, i) => {
    html += rowHTML(r.label, r.obj);
    if (i < active.length - 1) html += `<div class="divider"></div>`;
  });
  if (inactive.length && active.length) html += `<div class="divider"></div>`;
  inactive.forEach(r => { html += rowHTML(r.label, null); });
  body.innerHTML = html;
}

/* ── message helpers ── */
const sendBg = msg => new Promise(r => chrome.runtime.sendMessage(msg, r));

async function getClaudeTab() {
  return new Promise(r => chrome.tabs.query({ url: 'https://claude.ai/*' }, t => r(t[0] || null)));
}

async function msgTab(tabId, msg) {
  return new Promise(r => {
    chrome.tabs.sendMessage(tabId, msg, res => {
      if (chrome.runtime.lastError) r(null);
      else r(res || null);
    });
  });
}

/* ── main load ── */
async function load(force = false) {
  shimmer();
  refreshBtn.classList.add('spinning');

  // Serve cache if fresh
  if (!force) {
    const cached = await sendBg({ type: 'GET_CACHE' });
    if (cached && Date.now() - cached.fetchedAt < 60_000) {
      renderData(cached.data, cached.fetchedAt);
      refreshBtn.classList.remove('spinning');
      return;
    }
  }

  // Need a claude.ai tab
  const tab = await getClaudeTab();
  if (!tab) {
    showState(
      `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F26522" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
      'No Claude.ai tab open',
      'Open claude.ai in a tab first — the extension fetches data from there.',
      'Open Claude.ai',
      () => chrome.tabs.create({ url: 'https://claude.ai' })
    );
    refreshBtn.classList.remove('spinning');
    return;
  }

  // Get stored org ID
  const cached = await sendBg({ type: 'GET_CACHE' });
  const orgId  = cached?.orgId || null;

  // Send fetch request to content script
  let res = await msgTab(tab.id, { type: 'FETCH_USAGE', orgId });

  // Content script may not be injected yet — inject and retry once
  if (!res) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await new Promise(r => setTimeout(r, 250));
      res = await msgTab(tab.id, { type: 'FETCH_USAGE', orgId });
    } catch (e) {
      res = { error: e.message };
    }
  }

  refreshBtn.classList.remove('spinning');

  if (!res || res.error === 'NO_ORG_ID') {
    showState(
      `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F26522" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      'Org ID not found',
      'Visit claude.ai/settings/usage once — that page sets the lastActiveOrg cookie and the extension will pick it up.',
      'Open Usage Settings',
      () => chrome.tabs.create({ url: 'https://claude.ai/settings/usage' })
    );
    return;
  }

  if (res.error === 'HTTP 401' || res.error === 'HTTP 403') {
    showState(
      `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F26522" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      'Not logged in',
      'Log in to Claude.ai, then click refresh.',
      'Open Claude.ai',
      () => chrome.tabs.create({ url: 'https://claude.ai' })
    );
    return;
  }

  if (res.error) {
    showState(
      `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 20 2 20"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
      'Fetch failed',
      res.error,
      null, null
    );
    return;
  }

  // Save to cache with org ID
  sendBg({ type: 'SAVE_CACHE', payload: { data: res.data, orgId: res.orgId, fetchedAt: res.fetchedAt } });
  renderData(res.data, res.fetchedAt);
}

/* ── boot ── */
setInterval(async () => {
  const c = await sendBg({ type: 'GET_CACHE' });
  if (c) footer.textContent = `Updated ${timeAgo(c.fetchedAt)}`;
}, 30_000);

refreshBtn.addEventListener('click', () => load(true));
load();
