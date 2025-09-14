// Fill data/scripts.json blocks from Scripts.txt (UCD v16.0.0)
// - For each Script (excluding Common/Inherited/Unknown), collect ranges
// - Merge contiguous ranges per script and write as hex ranges to scripts.json.blocks

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const scriptsTxtPath = path.join(ROOT, 'Scripts.txt');
const scriptsJsonPath = path.join(ROOT, 'data', 'scripts.json');

function makeId(scriptName) {
  return scriptName.replace(/_/g, '-').toLowerCase();
}

function parseScriptsTxt(text) {
  const exclude = new Set(['Common', 'Inherited', 'Unknown']);
  const map = new Map(); // id -> [[start,end], ...] (numbers)
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    if (!/^[0-9A-F]/.test(line)) continue;
    const semi = line.indexOf(';');
    if (semi === -1) continue;
    const left = line.slice(0, semi).trim();
    const right = line.slice(semi + 1).split('#')[0].trim();
    const scriptName = right;
    if (!scriptName || exclude.has(scriptName)) continue;
    const id = makeId(scriptName);

    let start, end;
    if (left.includes('..')) {
      const [a, b] = left.split('..');
      start = parseInt(a, 16);
      end = parseInt(b, 16);
    } else {
      start = parseInt(left, 16);
      end = start;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push([start, end]);
  }
  // merge contiguous ranges
  for (const [id, ranges] of map) {
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (!last) merged.push(r);
      else if (r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
      else merged.push(r);
    }
    map.set(id, merged);
  }
  return map;
}

function toHex(n) {
  let h = n.toString(16).toUpperCase();
  if (h.length < 4) h = h.padStart(4, '0');
  return h;
}

function main() {
  const txt = fs.readFileSync(scriptsTxtPath, 'utf8');
  const rangesById = parseScriptsTxt(txt);
  const json = JSON.parse(fs.readFileSync(scriptsJsonPath, 'utf8'));
  const ids = new Set(json.map(x => x.id));

  let updated = 0;
  for (const entry of json) {
    const id = entry.id;
    const ranges = rangesById.get(id);
    if (!ranges) continue;
    entry.blocks = ranges.map(([s, e]) => [toHex(s), toHex(e)]);
    updated++;
  }

  fs.writeFileSync(scriptsJsonPath, JSON.stringify(json, null, 2) + '\n');
  console.error(`Updated blocks for ${updated} categories in data/scripts.json`);
}

main();

