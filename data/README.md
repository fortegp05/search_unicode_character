# data directory

This folder holds UCD originals (kept at project root per instruction) and generated JSON used by the static site.

Contents
- `generated/` — machine-/hand-generated artifacts consumed by the app
- `meta.json` — metadata for footer display (UCD version and sources)
- `scripts.json` — category definitions used by the UI

Notes
- UCD originals (`Blocks.txt`, `Scripts.txt`, `UnicodeData.txt`) are placed at the repository root for v16.0.0.
- Code point display format: use uppercase hexadecimal `U+XXXX` (4–6 digits).

Generation Steps (Phase 1)
1) Define Script↔Block whitelist in `data/generated/script_block_map.json`.
2) Derive `data/scripts.json` by mapping each Block name to inclusive ranges from `Blocks.txt`.
3) Set `excludeCategories` to at least `["Cn","Cs","Cc"]` (optionally consider `"Cf"`).
4) Record UCD version and source URLs in `data/meta.json` (and `data/generated/meta.json`).

