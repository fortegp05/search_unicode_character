// Phase 1/2: minimal data loader + initial UI bootstrap
// - loadScripts/loadMeta to fetch JSON assets
// - formatCodePoint for U+XXXX (4–6 hex digits, uppercase)
// - DOM bootstrap to render category list and footer meta

// ----------------- Data loading -----------------
export async function loadScripts() {
  const res = await fetch('data/scripts.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load scripts.json: ${res.status}`);
  return res.json();
}

export async function loadMeta() {
  const res = await fetch('data/meta.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load meta.json: ${res.status}`);
  return res.json();
}

let _unicodeNameMap = null; // Map<number,string>
async function loadUnicodeNames() {
  if (_unicodeNameMap) return _unicodeNameMap;
  try {
    const res = await fetch('UnicodeData.txt', { cache: 'no-store' });
    if (!res.ok) throw new Error(`UnicodeData.txt ${res.status}`);
    const text = await res.text();
    const map = new Map();
    for (const line of text.split(/\r?\n/)) {
      if (!line) continue;
      const parts = line.split(';');
      if (parts.length < 2) continue;
      const cp = parseInt(parts[0], 16);
      const name = parts[1] || '';
      if (Number.isFinite(cp)) map.set(cp, name);
    }
    _unicodeNameMap = map;
  } catch {
    _unicodeNameMap = new Map();
  }
  return _unicodeNameMap;
}

async function loadDisplayableMap() {
  try {
    const res = await fetch('data/generated/displayable_map.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const ranges = (data.ranges || []).map(([s, e]) => [parseInt(s, 16), parseInt(e, 16)]);
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return ranges;
  } catch (e) {
    return null; // fallback: no filter
  }
}

export function formatCodePoint(cp) {
  // cp: number or hex string; returns U+XXXX (4–6 uppercase hex digits)
  const n = typeof cp === 'string' ? parseInt(cp, 16) : cp >>> 0;
  let hex = n.toString(16).toUpperCase();
  if (hex.length < 4) hex = hex.padStart(4, '0');
  // limit to 6 digits for BMP/SMP ranges per spec
  return `U+${hex}`;
}

// ----------------- Utilities (Phase 3) -----------------
function expandBlocksToCodePoints(blocks) {
  // blocks: [[startHex, endHex], ...] -> number[]
  const cps = [];
  for (const [s, e] of blocks || []) {
    const start = parseInt(s, 16);
    const end = parseInt(e, 16);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    for (let cp = start; cp <= end; cp++) cps.push(cp);
  }
  return cps;
}

function toGlyph(cp) {
  try {
    return String.fromCodePoint(cp);
  } catch {
    return '\uFFFD'; // replacement character on invalid input
  }
}

// Optional: expose to window during early dev without module bundler
if (typeof window !== 'undefined') {
  window.UCD = { loadScripts, loadMeta, formatCodePoint };
}

// =============== Phase 2 bootstrap ===============
async function init() {
  const categoryList = null; // category list UI removed; chips drive selection
  const ucdMeta = document.getElementById('ucd-meta');
  const grid = document.getElementById('char-grid');
  const quickChips = document.getElementById('quick-chips');
  // Composer / Copy UI (Phase 6)
  const composeBox = document.getElementById('compose-box');
  const selectedNameInput = document.getElementById('selected-name');
  const btnCopyName = document.getElementById('btn-copy-name');
  const btnCopyAll = document.getElementById('btn-copy-all');
  const btnClear = document.getElementById('btn-clear');
  const toastEl = document.getElementById('toast');
  // Random UI handles
  const randOneBtn = document.getElementById('btn-random-one');
  const randManyBtn = document.getElementById('btn-random-many');
  const displayableRanges = await loadDisplayableMap();

  // Footer meta
  try {
    const meta = await loadMeta();
    const version = meta?.unicodeVersion || 'unknown';
    const src = Array.isArray(meta?.sources) && meta.sources.length > 0 ? meta.sources[0] : '';
    ucdMeta.textContent = src ? `UCD v${version} / ${src}` : `UCD v${version}`;
  } catch (e) {
    ucdMeta.textContent = 'UCD: メタ情報を読み込めませんでした';
    // non-fatal for Phase 2
  }

  // Categories + Search (Phase 4)
  try {
    const scripts = await loadScripts();
    buildQuickChips(quickChips, scripts, selectedNameInput, grid, displayableRanges);

    // Phase 5: Random display wiring
    wireRandomSection({ scripts, displayableRanges, randOneBtn, randManyBtn });

    // Phase 6: Copy interactions (single + bulk)
    wireCopyInteractions({ scripts, grid, composeBox, selectedNameInput, btnCopyName, btnCopyAll, btnClear, toastEl });
  } catch (e) {
    // On failure, show minimal message
    // swallow; minimal UI can operate without category list
  }
}

// category list UI removed

function renderGridByCategory(gridEl, category, displayableRanges) {
  gridEl.textContent = '';
  if (!category) return;

  let cps = expandBlocksToCodePoints(category.blocks);
  if (Array.isArray(displayableRanges)) {
    cps = cps.filter(cp => isDisplayable(cp, displayableRanges));
  }
  if (!cps.length) {
    const empty = document.createElement('div');
    empty.className = 'grid-empty';
    empty.textContent = '表示可能な文字がありません（ブロック未割当または除外対象）';
    gridEl.appendChild(empty);
    return;
  }

  // Progressive chunk rendering for large categories
  const tLabel = `render:${category.id}`;
  console.time(tLabel);
  const BATCH = 500;
  let i = 0;

  function renderBatch() {
    const frag = document.createDocumentFragment();
    for (let n = 0; n < BATCH && i < cps.length; n++, i++) {
      const cp = cps[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cell';
      btn.setAttribute('role', 'button');
      btn.dataset.cp = cp.toString(16).toUpperCase();

      const glyph = document.createElement('span');
      glyph.className = 'glyph';
      glyph.textContent = toGlyph(cp);

      const code = document.createElement('span');
      code.className = 'code';
      code.textContent = formatCodePoint(cp);

      btn.appendChild(glyph);
      btn.appendChild(code);
      frag.appendChild(btn);
    }
    gridEl.appendChild(frag);
    if (i < cps.length) {
      requestAnimationFrame(renderBatch);
    } else {
      console.timeEnd(tLabel);
    }
  }

  requestAnimationFrame(renderBatch);
}

function isDisplayable(cp, ranges) {
  // binary search on sorted ranges [start,end]
  let lo = 0, hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [s, e] = ranges[mid];
    if (cp < s) hi = mid - 1;
    else if (cp > e) lo = mid + 1;
    else return true;
  }
  return false;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init, { once: true });
}

// =============== Quick Chips (direct select) ===============
function buildQuickChips(container, scripts, selectedNameInput, gridEl, displayableRanges) {
  if (!container) return;
  container.textContent = '';
  const frag = document.createDocumentFragment();
  for (const s of scripts) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = s.label || s.id;
    b.dataset.id = s.id;
    b.addEventListener('click', () => {
      // Directly select the category and render
      try {
        const id = b.dataset.id;
        const cat = scripts.find(x => x.id === id);
        if (!cat) return;
        // Highlight the selected chip (blue border like category selection)
        for (const el of container.querySelectorAll('.chip[aria-pressed="true"]')) el.removeAttribute('aria-pressed');
        b.setAttribute('aria-pressed', 'true');
        // Show selected label next to compose-box for copying
        if (selectedNameInput) selectedNameInput.textContent = cat.label || cat.id;
        if (gridEl) {
          renderGridByCategory(gridEl, cat, displayableRanges);
          try {
            gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } catch {}
        }
      } catch {}
    });
    frag.appendChild(b);
  }
  container.appendChild(frag);
}

// =============== Phase 5: Random Display ===============
const randomCache = {
  all: null, // number[]
};

// getActiveCategoryId removed (no category list)

function buildCategoryArray(category, displayableRanges) {
  let cps = expandBlocksToCodePoints(category?.blocks || []);
  if (Array.isArray(displayableRanges)) {
    cps = cps.filter(cp => isDisplayable(cp, displayableRanges));
  }
  return cps;
}

function getAllArray({ scripts, displayableRanges }) {
  if (!randomCache.all) {
    let all = [];
    for (const s of scripts) {
      const arr = buildCategoryArray(s, displayableRanges);
      if (arr.length) all = all.concat(arr);
    }
    randomCache.all = all;
  }
  return randomCache.all;
}

function randInt(max) {
  if (max <= 0) return 0;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return Math.floor((a[0] / 0x100000000) * max);
  }
  return Math.floor(Math.random() * max);
}

function pickOne(arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[randInt(arr.length)];
}

function pickMany(arr, n, { allowDuplicates = true } = {}) {
  const out = [];
  if (!arr || arr.length === 0 || n <= 0) return out;
  if (allowDuplicates) {
    for (let i = 0; i < n; i++) out.push(pickOne(arr));
    return out;
  }
  // without replacement (not required, but handy)
  const used = new Set();
  while (out.length < n && used.size < arr.length) {
    const v = pickOne(arr);
    if (!used.has(v)) { used.add(v); out.push(v); }
  }
  return out;
}

function renderRandomResult(container, cps) {
  container.textContent = '';
  if (!cps || cps.length === 0) {
    const div = document.createElement('div');
    div.className = 'grid-empty';
    div.textContent = '抽選対象がありません（カテゴリ未選択または範囲外）';
    container.appendChild(div);
    return;
  }
  const frag = document.createDocumentFragment();
  for (const cp of cps) {
    const btn = document.createElement('div');
    btn.className = 'cell';
    const glyph = document.createElement('span');
    glyph.className = 'glyph';
    glyph.textContent = toGlyph(cp);
    const code = document.createElement('span');
    code.className = 'code';
    code.textContent = formatCodePoint(cp);
    btn.appendChild(glyph);
    btn.appendChild(code);
    frag.appendChild(btn);
  }
  container.appendChild(frag);
}

function wireRandomSection({ scripts, displayableRanges, randOneBtn, randManyBtn }) {
  const resultEl = document.getElementById('random-result');

  randOneBtn?.addEventListener('click', () => {
    // Phase 12: single pick from ALL
    const scope = getAllArray({ scripts, displayableRanges });
    const cp = pickOne(scope);
    renderRandomResult(resultEl, typeof cp === 'number' ? [cp] : []);
  });

  randManyBtn?.addEventListener('click', () => {
    // Phase 12: multiple picks from ALL
    const scope = getAllArray({ scripts, displayableRanges });
    // Pick count as a random integer between 2 and 10 inclusive
    const n = 2 + randInt(9);
    const picks = pickMany(scope, n, { allowDuplicates: true });
    renderRandomResult(resultEl, picks.filter(x => typeof x === 'number'));
  });
}

// =============== Phase 6: Copy (single + bulk) ===============
function showToast(el, message, { kind = 'info', timeout = 2000 } = {}) {
  if (!el) return;
  el.textContent = message || '';
  el.dataset.kind = kind; // allow CSS styling via [data-kind]
  el.hidden = false;
  if (timeout > 0) {
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.hidden = true; }, timeout);
  }
}

async function copyText(text) {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // fallthrough to fallback
  }
  return false;
}

function appendToComposer(box, glyph) {
  if (!box) return;
  box.value += glyph;
  box.scrollTop = box.scrollHeight;
}

// findCategoriesForCodePoint removed (no category switching by glyph)

function getCategoryLabelForCodePoint(cp, scripts) {
  for (const s of scripts || []) {
    for (const [hs, he] of s.blocks || []) {
      const start = parseInt(hs, 16);
      const end = parseInt(he, 16);
      if (cp >= start && cp <= end) return s.label || s.id;
    }
  }
  return null;
}

function wireCopyInteractions({ scripts, grid, composeBox, selectedNameInput, btnCopyName, btnCopyAll, btnClear, toastEl }) {
  // Activate a cell to append + copy single glyph
  function activateCell(btn) {
    const glyph = btn?.querySelector('.glyph')?.textContent || '';
    if (!glyph) return;
    // Selection highlight on the grid
    for (const el of grid.querySelectorAll('.cell[aria-current="true"]')) el.removeAttribute('aria-current');
    btn.setAttribute('aria-current', 'true');

    appendToComposer(composeBox, glyph);
    // Update selected name field: prefer category label (Japanese), fallback to Unicode name
    try {
      const hex = btn?.dataset?.cp;
      const cp = parseInt(hex || '0', 16);
      if (Number.isFinite(cp)) {
        const label = getCategoryLabelForCodePoint(cp, scripts);
        if (label && selectedNameInput) {
          selectedNameInput.textContent = label;
        } else {
          const codeText = formatCodePoint(cp);
          if (selectedNameInput) selectedNameInput.textContent = codeText;
          loadUnicodeNames().then((map) => {
            const nm = map.get(cp);
            if (selectedNameInput) selectedNameInput.textContent = nm ? `${codeText} ${nm}` : codeText;
          }).catch(() => {});
        }
      } else if (selectedNameInput) {
        selectedNameInput.textContent = '';
      }
    } catch {}
    copyText(glyph).then((ok) => {
      if (ok) {
        showToast(toastEl, '1文字をコピーしました', { kind: 'success' });
      } else {
        // Fallback: select end of composeBox and instruct user to copy manually
        try {
          if (composeBox) {
            // Place selection at the end so the newly appended glyph is visible
            composeBox.focus();
            const len = composeBox.value.length;
            composeBox.setSelectionRange(len > 0 ? len - 1 : 0, len);
          }
        } catch {}
        showToast(toastEl, 'コピーできませんでした。選択しました→ Ctrl/Cmd + C でコピー', { kind: 'info', timeout: 3500 });
      }
    });

    // Category UI removed; no auto-switching by glyph
  }

  // Delegate click/keydown on grid
  grid?.addEventListener('click', (e) => {
    const btn = e.target.closest('button.cell');
    if (!btn || !grid.contains(btn)) return;
    activateCell(btn);
  });
  grid?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const btn = e.target.closest('button.cell');
    if (!btn || !grid.contains(btn)) return;
    e.preventDefault();
    activateCell(btn);
  });

  // Bulk copy
  btnCopyAll?.addEventListener('click', async () => {
    const text = composeBox?.value || '';
    if (!text) {
      showToast(toastEl, 'コピー対象がありません', { kind: 'info' });
      return;
    }
    const ok = await copyText(text);
    if (ok) showToast(toastEl, 'まとめてコピーしました', { kind: 'success' });
    else {
      try {
        composeBox.focus();
        composeBox.select();
      } catch {}
      showToast(toastEl, 'コピーできませんでした。選択しました→ Ctrl/Cmd + C', { kind: 'info', timeout: 3500 });
    }
  });

  // Copy selected name
  btnCopyName?.addEventListener('click', async () => {
    const text = selectedNameInput?.textContent || '';
    if (!text) {
      showToast(toastEl, 'コピー対象の名前がありません', { kind: 'info' });
      return;
    }
    const ok = await copyText(text);
    if (ok) showToast(toastEl, '文字名をコピーしました', { kind: 'success' });
    else {
      try {
        if (selectedNameInput) {
          const range = document.createRange();
          range.selectNodeContents(selectedNameInput);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } catch {}
      showToast(toastEl, 'コピーできませんでした。選択しました→ Ctrl/Cmd + C', { kind: 'info', timeout: 3500 });
    }
  });

  // Clear
  btnClear?.addEventListener('click', () => {
    if (composeBox) composeBox.value = '';
    if (selectedNameInput) selectedNameInput.textContent = '';
    showToast(toastEl, 'クリアしました', { kind: 'info' });
  });
}
