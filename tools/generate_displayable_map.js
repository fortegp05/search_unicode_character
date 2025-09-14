// Generate data/generated/displayable_map.json from UnicodeData.txt
// - Mark code points displayable if General_Category is NOT in exclude set
// - Output compact ranges of hex strings

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const unicodeDataPath = path.join(ROOT, 'UnicodeData.txt');
const metaPath = path.join(ROOT, 'data', 'meta.json');
const outPath = path.join(ROOT, 'data', 'generated', 'displayable_map.json');

function toHex(n) {
  let h = n.toString(16).toUpperCase();
  if (h.length < 4) h = h.padStart(4, '0');
  return h;
}

function main() {
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const exclude = new Set(meta.excludeCategories || ['Cn', 'Cs', 'Cc']);
  const lines = fs.readFileSync(unicodeDataPath, 'utf8').split(/\r?\n/);

  const ranges = [];
  let pendingFirst = null; // { cp: number, name: string, cat: string }

  function pushCp(cp, cat) {
    const include = !exclude.has(cat);
    if (!include) return;
    const last = ranges[ranges.length - 1];
    if (!last) {
      ranges.push([cp, cp]);
    } else if (cp === last[1] + 1) {
      last[1] = cp;
    } else {
      ranges.push([cp, cp]);
    }
  }

  for (const line of lines) {
    if (!line) continue;
    const parts = line.split(';');
    if (parts.length < 3) continue;
    const cpHex = parts[0];
    const name = parts[1];
    const cat = parts[2];
    const cp = parseInt(cpHex, 16);
    if (Number.isNaN(cp)) continue;

    if (name.endsWith(', First>')) {
      pendingFirst = { cp, cat };
    } else if (name.endsWith(', Last>')) {
      if (pendingFirst) {
        for (let c = pendingFirst.cp; c <= cp; c++) pushCp(c, cat);
      }
      pendingFirst = null;
    } else {
      pushCp(cp, cat);
    }
  }

  // Convert to hex ranges
  const out = { ranges: ranges.map(([s, e]) => [toHex(s), toHex(e)]) };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.error(`Wrote ${out.ranges.length} displayable ranges to ${outPath}`);
}

main();

