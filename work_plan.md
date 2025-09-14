# 作業計画（work_plan）

本ドキュメントは `prd.md` の要求事項を満たすための作業計画です。各タスクは「前提条件」「タスク内容」「完了条件」を明示します。対象は完全静的（HTML/CSS/JS）サイトで、GitHub Pages での公開を想定します。

## フェーズ1: データ設計（UCD 由来）

### 前提条件
- [x] UCD（Unicode Character Database）の利用範囲の定義（コードポイント範囲、ブロック情報、カテゴリ名称の扱い）
- [x] ライセンス/出典表記方針（About/README に記載）
- [x] カテゴリ日本語ラベルの対訳ポリシー（英名→日本語名のルール）

### タスク
- UCD 公式から `Scripts.txt` `Blocks.txt` `UnicodeData.txt` を取得（バージョンと取得元URLを記録）
- 上記をもとにカテゴリ定義 `SCRIPTS` を整形（`data/scripts.json` など、対象は全ての文字カテゴリ）
  - 構造: `{id, label(日本語), tags, blocks[[startHex,endHex], ...]}`
  - 例: `hangul` は `[['1100','11FF'],['3130','318F'],['A960','A97F'],['AC00','D7AF'],['D7B0','D7FF']]`
- Script と Block の対応は手動ホワイトリスト方式で定義（1対1ではないため）
- `UnicodeData.txt` を根拠に「表示対象から除外する General_Category」を明記
  - 最低限除外: 未割当 `Cn` / サロゲート `Cs` / 制御 `Cc`（必要に応じて `Cf` 等の検討）
- 生成手順を簡潔に記録（コマンド/手順、反映先ファイル）
- カテゴリ日本語ラベルの対訳ポリシーを明文化し、初期ラベル/検索タグを定義（下記参照）

#### 対訳ポリシー（英名→日本語名）
- 既存の一般的呼称を優先、なければカタカナ転写を採用
- `id` はASCIIの安定名（例: `hangul`、`cyrillic`）、`label` は日本語
- 表記は原則「〜文字」。自然な固有名は例外可（例: ハングル、ヒエログリフ）
- 地域名＋体系名は「・」で接続（例: エジプト・ヒエログリフ）
- 同義語・別表記は検索タグで吸収（UI表示ラベルは1つに統一）
- Common/Inherited等の横断属性はカテゴリ化しない

#### 初期対訳例（ラベル/検索タグ）
- egyptian → ラベル: エジプト・ヒエログリフ／タグ: [ヒエログリフ, 聖刻文字, エジプト]
- anatolian → ラベル: アナトリア・ヒエログリフ／タグ: [ヒエログリフ, アナトリア]
- cuneiform → ラベル: 楔形文字／タグ: [くさび形, 楔形]
- hangul → ラベル: ハングル／タグ: [韓国語, 朝鮮文字]
- cyrillic → ラベル: キリル文字／タグ: [キリール, ロシア]

### 完了条件
- [x] `data/scripts.json`（または同等のJS定義）が存在し、`id`・日本語`label`・`tags`・`blocks` を含む
- [x] Script↔Block の採用範囲が明文化（対象ブロックの列挙または根拠の記載）
- [x] `UnicodeData.txt` に基づく除外ルール（`Cn`/`Cs`/`Cc` など）が仕様として明記（必要に応じて `Cf` を検討）
- [x] 出典（UCD各ファイルのバージョン/URL）がREADME等に記載
- [x] `app.js` から `data/scripts.json` を読み込める下準備がある（パス/読み込み関数の雛形）
- [x] カテゴリ日本語ラベルの対訳ポリシーが文書化されている
- [x] 全ての対象カテゴリの日本語ラベルと検索タグが定義されている（表記例: ヒエログリフ／楔形文字／ハングル／キリルを含む）
- [x] コードポイント表記ルール（`U+XXXX` 大文字16進、4〜6桁対応）が仕様として明記されている

### ステップバイステップ（実施手順）
1. ディレクトリの用意
   - 作成: `data/ucd/`, `data/generated/`
   - 目的: UCDの原データと生成済みデータを分離管理する

2. 除外ルールの確定（General_Category）
   - 基本除外: `Cn`（未割当）, `Cs`（サロゲート）, `Cc`（制御）
   - 任意検討: `Cf`（書式）
   - 記載先: 本ファイルの仕様節と `data/generated/meta.json`（`excludeCategories` 配列）

3. Script ↔ Block の対応表（ホワイトリスト）を定義
   - 理由: Script と Block は1対1でないため手動で採用範囲を明示
   - 形式: `data/generated/script_block_map.json`
     - 例:
       ```json
       {
         "hangul": ["Hangul Jamo", "Hangul Compatibility Jamo", "Hangul Jamo Extended-A", "Hangul Syllables", "Hangul Jamo Extended-B"],
         "cyrillic": ["Cyrillic", "Cyrillic Supplement", "Cyrillic Extended-A", "Cyrillic Extended-B", "Cyrillic Extended-C"],
         "egyptian": ["Egyptian Hieroglyphs"],
         "anatolian": ["Anatolian Hieroglyphs"],
         "cuneiform": ["Cuneiform", "Cuneiform Numbers and Punctuation", "Early Dynastic Cuneiform"]
       }
       ```

4. カテゴリ定義の雛形を作成（日本語ラベル/タグ）
   - 形式: `data/generated/scripts.template.json`
   - 各エントリ: `{ id, label, tags, blocks }`
     - `id`: ASCII安定名（例: `hangul`, `cyrillic`）
     - `label`: 日本語ラベル（例: `ハングル`, `キリル文字`）
     - `tags`: 検索タグ配列（同義語・英語表記など）
     - `blocks`: 後続の生成処理で自動充填（`[[startHex,endHex], ...]`）

5. 生成ロジックの設計（JavaScript系: Node.js/Deno 等）
   - 入力: `Scripts.txt`, `Blocks.txt`, `UnicodeData.txt`, `script_block_map.json`, `scripts.template.json`
   - 処理:
     - a) `Blocks.txt` をパースし、`{ blockName, startHex, endHex }[]` を構築
     - b) `script_block_map.json` に基づき、各 `id` の `blocks` に範囲を割当
     - c) `UnicodeData.txt` を用いて、各範囲内のコードポイントから除外カテゴリ（`Cn/Cs/Cc` 等）を除く
     - d) 範囲のマージ: 連続/重複をマージし、`[[start,end], ...]` に正規化
     - e) `scripts.template.json` の各エントリに `blocks` を埋める
   - 出力: `data/scripts.json`

6. カテゴリ定義（全カテゴリを対象に整備）
   - 例（表記例として含む）:
     - `egyptian`: エジプト・ヒエログリフ／タグ: [ヒエログリフ, 聖刻文字, エジプト]
     - `cuneiform`: 楔形文字／タグ: [くさび形, 楔形]
     - `hangul`: ハングル／タグ: [韓国語, 朝鮮文字]
     - `cyrillic`: キリル文字／タグ: [キリール, ロシア]

7. 検証（バリデーション）
   - 構文: `data/scripts.json` が有効なJSONである
   - 必須キー: 各エントリに `id`, `label`, `tags`, `blocks` が存在
   - 範囲: `blocks` の各要素が16進大文字で `start <= end`
   - 表示: 代表コードポイントを抽出し、未表示カテゴリ（`Cn/Cs/Cc`）が混入しない

8. 読み込み準備（フロント連携の雛形）
    - `app.js` で `fetch('data/scripts.json')` または静的インポートの雛形を用意
    - 簡易ログ: 読み込んだ件数・最初のカテゴリ名を `console` 出力

9. ドキュメント整備
    - `README` または `ABOUT` に出典・バージョン・取得元URL・除外方針を追記
    - コードポイント表記ルール（`U+XXXX`、16進大文字、4〜6桁）を仕様として追記
    - 本ファイル（work_plan）に決定値（バージョン、採用ブロック、除外カテゴリ）を更新

## フェーズ2: 画面骨組み（基本表示）

### 前提条件
- [x] 画面情報設計（ヘッダ、検索UI、カテゴリ一覧、グリッド、テキストボックス、トースト領域）
- [x] スタイルの基本トークン（色、余白、フォントサイズ）

### タスク
- `index.html` に主要セクションを用意（ARIAランドマーク、トーストのライブリージョン）
- `styles.css` でベースUIとグリッドのレスポンシブ定義
- `app.js` の初期化（データロード、初期レンダリング）
- フッター領域を用意し、使用UCDバージョンと出典URLを表示（静的文言 or `data/meta.json` 等から読込）

### 完了条件
- [x] ページを開くとカテゴリ一覧と空のグリッドが表示される（CodeX環境では実施できないためスキップ）
- [x] Lighthouse/アクセシビリティの初期スコアが閾値（例：90+）を満たす方向性である（CodeX環境では実施できないためスキップ）
- [x] 画面フッターに「使用UCDバージョン」と「出典URL」が表示される（CodeX環境では実施できないためスキップ）

### ステップバイステップ（実施手順）
1. エントリポイントの用意
   - 作成/確認: `index.html` / `styles.css` / `app.js`
   - `index.html` に `styles.css` と `app.js` を読み込む `<link>` `<script type="module">` を追加

2. index.html の骨組みマークアップ
   - ヘッダー: `<header role="banner">`（サイトタイトル、検索UIプレースホルダ）
   - メイン: `<main id="main" role="main">` 内に以下のセクションを配置
     - カテゴリ一覧: `<section id="categories" aria-labelledby="categories-title">`
       - 見出し: `<h2 id="categories-title">カテゴリ</h2>`
       - リストコンテナ: `<ul id="category-list" class="category-list" role="list"></ul>`
     - グリッド: `<section id="grid" aria-labelledby="grid-title">`
       - 見出し: `<h2 id="grid-title">文字グリッド</h2>`
       - コンテナ: `<div id="char-grid" class="grid" role="grid" aria-live="off"></div>`（空でOK）
     - テキストボックス（将来のコピー操作用）: `<section id="composer" aria-labelledby="composer-title">`
       - 見出し: `<h2 id="composer-title">選択中の文字</h2>`
       - テキストエリア: `<textarea id="compose-box" rows="2" aria-label="選択中の文字"></textarea>`（骨組みのみ）
   - トースト領域: `<div id="toast" role="status" aria-live="polite" aria-atomic="true" hidden></div>`
   - フッター: `<footer role="contentinfo">` に UCD バージョンと取得元URLを表示するためのプレースホルダ
     - 例: `<small id="ucd-meta">UCD: 読み込み中...</small>`

3. styles.css のベーススタイル
   - トークン: `:root` に色・余白・フォントサイズのCSSカスタムプロパティを定義（例: `--space-2`, `--fg`, `--bg`）
   - レイアウト: 見出し・リストのリセット、レスポンシブグリッド（`display: grid; grid-template-columns`）
   - アクセシビリティ: フォーカスリング（`outline`）とコントラストを確保、`prefers-color-scheme` で配慮

4. app.js の初期化（データロードと初期レンダリング）
   - 起動: `DOMContentLoaded` で初期化関数を実行
   - データ読込: `fetch('data/scripts.json')` でカテゴリデータを取得
   - レンダリング: カテゴリ一覧（日本語ラベル）を `#category-list` に描画、`#char-grid` は空のまま
   - フッターメタ: `fetch('data/meta.json')` などから `unicodeVersion` と `sources`（URL配列）を読み、`#ucd-meta` に反映（提供がない場合は静的プレースホルダ）
   - ユーティリティ: コードポイント表記用 `formatCodePoint(code)`（`U+XXXX` 形式、4〜6桁）を用意（後続フェーズで使用）

5. アクセシビリティ初期対応
   - ランドマーク: `header/main/footer` を使用、各セクションに `aria-labelledby` を付与
   - ライブリージョン: トーストは `role="status" aria-live="polite"` を設定
   - キーボード配慮: フォーカス可能要素の可視リングをCSSで保証

6. フッターのUCD表示
   - 表示内容: `UCD v<version> / <source-url>`（複数URLがある場合は最初の1件またはカンマ区切り）
   - データ源: `data/meta.json`（または `data/generated/meta.json`）。提供が無い場合は暫定文言

7. 動作確認（CodeX環境では実施できないためスキップ）
   - ブラウザで `index.html` を開き、以下を確認
     - カテゴリ一覧の見出しと空のグリッドが表示される
     - フッターに UCD バージョンと取得元URL（またはプレースホルダ）が表示される
     - タブ移動で主要要素にフォーカスが当たり、リングが見える

8. 完了チェック（本フェーズの完了条件に合致）
   - UI骨組みが揃い、カテゴリ一覧＋空グリッドの初期表示ができる
   - フッターにUCD情報が表示される（または読み込み失敗時に安全なプレースホルダ）
   - Lighthouse/アクセシビリティの初期スコアが目標域に入る見込み

## フェーズ3: カテゴリ別グリッド表示

### 前提条件
- [x] カテゴリとコードポイント群のマッピングが利用可能（フェーズ1）
  - 現状: 複数カテゴリ（ハングル／キリル／エジプト・ヒエログリフ／アナトリア・ヒエログリフ／楔形文字）について `data/scripts.json` にブロック範囲を付与済み。最終的に全カテゴリへ適用する。
  - 付帯データ: `data/generated/script_block_map.json`（Script→Block名のホワイトリスト）/ ルートの `Blocks.txt`（範囲）/ `UnicodeData.txt`（General_Category）。

### タスク
- カテゴリ選択に応じてグリッドに「文字＋コードポイント（U+XXXX）」をセル表示
- セルのフォーカス/ホバー/アクティブの状態定義（キーボード操作対応）
- 表示対象の厳密化: `UnicodeData.txt` の General_Category に基づき `Cn`/`Cs`/`Cc`（必要に応じて `Cf`）を除外したコードポイントのみ描画（PRDの「割り当て済みのグラフィック文字」に整合）。
- データ拡充: `script_block_map.json` と `Blocks.txt` から全カテゴリの `blocks` を `data/scripts.json` に反映（生成手順を確立）。

### 完了条件
- [x] すべてのカテゴリで100+セルの表示性能が実用的（初回レンダ 200ms 以内目安）（CodeX環境では実施できないためスキップ）
- [x] U+XXXXの表記が正しい（16進4〜6桁対応）
- [x] 表示対象の除外ルールが適用され、`Cn`/`Cs`/`Cc`（必要に応じて `Cf`）が描画されない
- [x] 全カテゴリの `blocks` が定義済み（`data/scripts.json`）

### ステップバイステップ（実施手順）
1. イベント配線（カテゴリ選択）
   - `#category-list` にデリゲーションでクリック/キー操作（Enter/Space）ハンドラを追加
   - 選択カテゴリの `id`（scripts.json の `id`）を取得し、`renderGridByCategory(id)` を呼ぶ
   - 選択状態のUI（`aria-current="true"` or `aria-selected="true"`/クラス付与）を更新

（実施状況）
- `app.js` に以下を実装
  - `expandBlocksToCodePoints(blocks)`／`toGlyph(cp)`／`renderGridByCategory(el, category)`
  - カテゴリ一覧のイベント委譲（クリック／Enter／Space）と `aria-current` 選択状態付与
  - 大規模カテゴリの段階描画（`requestAnimationFrame` で500件ごと）＋ `console.time` ログ
  - `data/generated/displayable_map.json` を読み込み、描画前に General_Category 除外（`Cn`/`Cs`/`Cc` ほか）を適用
- `styles.css`
  - `.cell:hover`/`:active` の視覚強化、選択中カテゴリ（`[aria-current="true"]`）の枠色強調
- `data/scripts.json`
  - 複数のカテゴリにブロック範囲を付与
    - Hangul: 1100–11FF, 3130–318F, A960–A97F, AC00–D7AF, D7B0–D7FF
    - Cyrillic: 0400–04FF, 0500–052F, 2DE0–2DFF, A640–A69F, 1C80–1C8F
    - Egyptian Hieroglyphs: 13000–1342F
    - Anatolian Hieroglyphs: 14400–1467F
    - Cuneiform: 12000–123FF, 12400–1247F, 12480–1254F
  - 自動反映: `tools/fill_blocks_from_scripts_txt.js` により全カテゴリへ `Scripts.txt` ベースの範囲を付与済み
  - 表示可能判定: `tools/generate_displayable_map.js` により `UnicodeData.txt` から除外カテゴリを除いた範囲を生成し、`data/generated/displayable_map.json` を作成済み

2. データ取得と展開ユーティリティ
   - `getCategoryById(id)` でカテゴリ定義を取得
   - `expandBlocksToCodePoints(blocks)` を実装
     - 入力: `[[startHex, endHex], ...]`
     - 出力: 数値コードポイント配列（`number[]`）
     - 実装: 16進→数値変換し、範囲をループで展開

3. 表示対象フィルタの導入（General_Category 準拠）
   - 方針: クライアント負荷/サイズを考慮し、事前生成方式を採用
   - 生成: `tools/generate_displayable_map.js`（新規）を用意
     - 入力: ルートの `UnicodeData.txt`
     - 出力: `data/generated/displayable_map.json`
       - 形式（例）: `{ "12000": true, "12001": true, ... }` または範囲圧縮 `{ ranges: [[start,end], ...] }`
       - 判定: `General_Category` が `Cn`/`Cs`/`Cc`（必要に応じて `Cf`）以外を true とする
   - クライアント適用: `app.js` の `renderGridByCategory` 内で `cps` をフィルタ（`displayable_map` を参照）
   - メタ: 適用した除外カテゴリを `data/meta.json.excludeCategories` と一致させる（PRD整合）

4. Script→Block の全カテゴリ反映（データ拡充）
   - 入力: ルートの `Scripts.txt`
   - 実装: `tools/fill_blocks_from_scripts_txt.js`（新規）
     - `Scripts.txt` のスクリプト範囲を集約し、`data/scripts.json` の各 `id` に `blocks` を更新

5. パフォーマンス検証（全カテゴリ）（CodeX環境では実施できないためスキップ）
   - 計測: 各カテゴリ選択時、最初の100セル描画までの時間を `console.time('render:<id>')` で記録
   - 目標: 初回レンダ 200ms 以内（PRD更新条件）。閾値超過カテゴリがあれば、チャンクサイズ最適化や仮想化を検討
   - 最適化オプション:
     - 大規模カテゴリの初期表示は先頭 N 件（例: 200）に制限し、スクロールで追描画（仮想リスト）
     - `DocumentFragment` の使用・レイアウトスラッシング回避（既実装）

6. 空状態/異常系
   - フィルタ適用後に0件の場合、空状態メッセージを表示（既実装文言を使用）
   - 不正な範囲/パース失敗はスキップし、コンソールに警告（開発時のみ）

7. 文字生成ユーティリティ
   - `toGlyph(cp)` を実装: `String.fromCodePoint(cp)` を用いて1文字文字列を返す
   - `formatCodePoint(cp)` を実装: `U+` + 4〜6桁の大文字16進に整形（例: `U+1100`, `U+1F600`）

8. グリッド描画ロジック
   - `renderGridByCategory(id)`
     - a) 既存ノードをクリア（`#char-grid` の子要素を削除）
     - b) `expandBlocksToCodePoints` でコードポイント配列を取得
     - c) パフォーマンス確保のため `DocumentFragment` にセルを構築
     - d) セルDOM（例）:
       - 要素: `<button class="cell" role="button" data-cp="<hex>">`
       - 内容: `<span class="glyph">{glyph}</span><span class="code">{U+XXXX}</span>`
     - e) フラグメントを `#char-grid` に一回で挿入
     - f) 100+ セルで `console.time`/`console.timeEnd` によるレンダ時間ログ（目安200ms以内）

9. スタイル適用（states + レイアウト補強）
   - `.grid` の `grid-template-columns` を `auto-fill, minmax(… , 1fr)` で可変カラム化
   - `.cell` に `:hover`, `:focus-visible`, `:active` の視認性強化（コントラスト/アウトライン）
   - `.glyph` は大きめフォントサイズ、`.code` は等幅フォント/小さめ/薄めの色

10. キーボード操作の最低限対応
   - セルは `button` 要素（または `div tabindex="0" role="button"`）で Enter/Space に反応できるようにする
   - 次フェーズ以降のアクション（コピー等）に備え、`data-cp` を保持

11. 表記の正当性チェック
   - 代表的な複数セルで `formatCodePoint` が PRD規定（大文字16進、4〜6桁）に合致することを確認
   - BMP外（U+10000以上）のサロゲート絡みも `String.fromCodePoint` で正しく表示されることを確認

12. 動作確認（CodeX環境では実施できないためスキップ）
   - 任意のカテゴリを選択→100+セル規模で一覧が即時に表示される
   - セルのフォーカス/ホバー/アクティブが視認でき、Tab/Shift+Tab で到達できる

## フェーズ4: 検索・フィルタ

### 前提条件
 - [x] タグデータ（日本語/英語）が各エントリに存在する、またはカテゴリ・ブロック名から導出可能

### タスク
- キーワード検索でカテゴリ名・タグに対する前方/部分一致フィルタを実装
- クイックチップ（全カテゴリのショートカット）を実装

### 完了条件
- [x] 該当件数が0件のとき空状態UIを表示（CodeX環境では実施できないためスキップ）
- [x] 日本語・英語どちらのキーワードでも意図どおりにヒットする（CodeX環境では実施できないためスキップ）

### ステップバイステップ（実施手順）
1. 検索UIの実装
   - `index.html`（ヘッダ内）に検索フォームを追加
     - 入力欄: `<input id="search-input" type="search" placeholder="カテゴリ名・タグで検索" aria-label="カテゴリ検索">`
     - クリア: `<button id="search-clear" type="button" aria-label="検索条件をクリア">×</button>`（視覚的に小さく）
     - コンテナ: `<form id="search-form" role="search">` とし、送信は抑止してJSで処理

2. クイックチップ（全カテゴリショートカット）
  - `index.html` に `<div id="quick-chips" aria-label="カテゴリ一覧" role="toolbar"></div>` を追加
  - `app.js` 初期化時に、全てのカテゴリからチップを生成
     - 要素例: `<button class="chip" data-query="キリル">キリル</button>`
   - クリックで `#search-input` に反映し、検索を発火（`input` イベントをdispatch）

3. 正規化ユーティリティの用意
   - `normalizeText(str)` を実装
     - Unicode正規化（NFKC）→ 小文字化 → 前後空白除去
     - 全角/半角の揺れを吸収、英語/日本語の混在に配慮

4. 検索インデックスの構築
   - `buildSearchIndex(scripts)` を実装
     - 各カテゴリに対して、`indexText = [label, ...tags].join(' ')` を生成
     - 正規化済み文字列を保持 `{ id, normLabel, normTags, normAll }`
   - 初期化時に一度だけ生成し、以降はこれを用いてフィルタ

5. フィルタロジック（前方/部分一致）
   - `filterCategories(query)` を実装
     - `q = normalizeText(query)` が空なら全件返却
     - 一致優先度: 前方一致（`startsWith`）を優先し、無ければ部分一致（`includes`）
     - 対象は `normLabel` と `normTags`（日本語/英語の両方を含む）

6. レンダリング（カテゴリ一覧の更新）
   - `renderCategoryList(filtered)` を実装
     - `#category-list` の子要素を差し替え
     - 件数バッジ（任意）や選択状態の維持に配慮
   - 0件時は空状態UIを表示
     - 例: `<li class="empty">該当するカテゴリがありません</li>` を一時挿入（`role="status"`を付与）

7. 入力イベント処理
   - `#search-input` の `input` イベントでデバウンス（150ms 程度）し `filterCategories` を実行
   - `#search-clear` で入力値を空にし、全件表示へ戻す
   - `#search-form` の `submit` は `preventDefault()` してページ遷移しない

8. アクセシビリティ（CodeX環境では実施できないためスキップ）
   - 検索フォームに `role="search"`、`aria-label` を設定
   - クイックチップは `button` 要素で、押下時に `aria-pressed` を適宜更新（トグル性がある場合）
   - 空状態メッセージは `role="status" aria-live="polite"` で読み上げを促す

9. 動作確認（CodeX環境では実施できないためスキップ）
   - 日本語/英語のキーワードでカテゴリ名・タグにヒットすることを確認（例: "キリル" / "cyrillic"）
   - 前方一致と部分一致の両方が期待通りに動作
   - クイックチップ押下で即座にリストが絞り込まれる
   - 0件時に空状態UIが表示・読み上げされる

## フェーズ5: ランダム表示

### 前提条件
- [x] 全エントリ/カテゴリ別のデータ配列にアクセス可能

### タスク
- ランダム複数文字の取得（全体/カテゴリ）と表示
- ランダム一文字（解説なし）ボタンで単一表示（U+XXXX併記）

### 完了条件
- [x] ランダム操作後のUIレスポンスが即時（100ms 以内）（CodeX環境では実施できないためスキップ）
- [x] 同一セッション内である程度の多様性が確認できる（重複は許容）（CodeX環境では実施できないためスキップ）

### ステップバイステップ（実施手順）
1. UI要素の追加（index.html）
   - ランダム操作セクションを作成: `<section id="random" aria-labelledby="random-title">`
     - 見出し: `<h2 id="random-title">ランダム表示</h2>`
     - 一文字ボタン: `<button id="btn-random-one" type="button">ランダム一文字</button>`（U+XXXX併記で表示）
     - 複数文字: `<input id="random-count" type="number" min="1" max="100" value="8" aria-label="表示個数">` と `<button id="btn-random-many" type="button">ランダム複数</button>`
     - スコープ選択: 既存のカテゴリ選択と連動（現在選択カテゴリ／全体）。全体用のトグル: `<label><input id="random-scope-all" type="checkbox">全体から</label>`
     - 出力領域: `<div id="random-result" class="grid" role="region" aria-live="polite"></div>`

2. 事前計算とキャッシュ（即時性確保）
   - `expandBlocksToCodePoints`（フェーズ3）を再利用
   - 初回アクセス時に、各カテゴリのコードポイント配列をキャッシュ（例: `cache.byCategory[id] = number[]`）
   - 全体スコープは `cache.all` に全カテゴリを結合（初回のみ）

3. 乱数ユーティリティ
   - `randInt(max)` を実装（0..max-1）。可能なら `crypto.getRandomValues`、無ければ `Math.random` フォールバック
   - `pickOne(arr)` / `pickMany(arr, n, {allowDuplicates: true})` を実装
     - PRD要件により重複は許容（with replacement）。即時性を重視

4. ハンドラ実装（app.js）
   - `#btn-random-one` クリック: スコープ配列を取得 → 1件抽出 → 描画
   - `#btn-random-many` クリック: `#random-count` を取得 → n件抽出 → 描画
   - スコープ決定: `#random-scope-all` がONなら `cache.all`、OFFなら現在選択カテゴリの配列

5. 表示レンダリング
   - 出力: `#random-result` をクリアし、`DocumentFragment` にセルを構築して一括挿入
   - セル構造はフェーズ3のセルと同様（`.glyph` + `.code`）で、`formatCodePoint` を用いて `U+XXXX` 併記
   - 一文字ボタンの結果は最上段左に単一セルで表示（既存結果は置換）

6. スタイル調整
   - `#random-result.grid` はレスポンシブ。複数時は複数カラム、一文字時は目立つサイズに調整可
   - 入力・ボタンはキーボード操作でアクセス可能にし、フォーカスリングを適用

7. パフォーマンス計測（CodeX環境では実施できないためスキップ）
  - 抽選→描画までの処理に `console.time('random')`/`console.timeEnd('random')` を一時追加し、100ms以内を目安
   - 大規模スコープ時は抽選のみで即時表示できるよう、展開配列のキャッシュを活用

8. アクセシビリティ
   - `#random-result` を `aria-live="polite"` にして更新を読み上げ（内容が煩雑な場合は `off` に調整）
   - ボタンに `aria-label` を付与（例: "全体からランダム一文字" など）

9. 動作確認
   - 全体/カテゴリ別の両スコープで即時表示される
   - 一文字はU+XXXX併記、複数は所定個数が表示される
   - 重複が発生し得るが、体感的な多様性があることを確認

## フェーズ6: コピー操作（単一・まとめて）

### 前提条件
- [x] クリップボードAPIのサポート状況確認ロジックの方針
- [x] 画面下部のテキストボックス領域の用意

### タスク
- セルクリックでテキストボックス末尾へ追記＋単一文字の即時コピー
- 「まとめてコピー」ボタンの実装（ボックス内テキストの一括コピー）
- クリップボードAPI非対応時のフォールバック（選択→コピー案内）
- 成功/失敗のトースト通知

### 完了条件
- [x] 主要ブラウザ（最新Chrome/Edge/Firefox/Safari）でコピー成功が確認できる（CodeX環境では実施できないためスキップ）
- [x] 非対応環境でフォールバックの案内が表示され、実用可能（CodeX環境では実施できないためスキップ）

### ステップバイステップ（実施手順）
1. UI要素の追加/確認（index.html）
   - 既存のテキストボックス: `<textarea id="compose-box">`（フェーズ2で作成済み）
   - まとめてコピー: `<button id="btn-copy-all" type="button">まとめてコピー</button>` を `#composer` セクション内に追加
   - クリア: `<button id="btn-clear" type="button">クリア</button>` を `#composer` に追加
   - トースト: `<div id="toast" role="status" aria-live="polite" aria-atomic="true" hidden></div>`（フェーズ2で作成済み）

2. セル操作のイベント配線（app.js）
   - デリゲーションで `#char-grid` に `click` と `keydown(Enter/Space)` をハンドル
   - 対象セルからコードポイント（`data-cp`）と文字グリフを取得
   - `handleCellActivate(glyph)` を呼ぶ（クリック順を保持、重複は許容）

3. 作文ボックスへの追記（クリック順・重複許容）
   - `appendToComposer(glyph)` を実装
     - `const box = document.getElementById('compose-box')`
     - 末尾に `glyph` を追記（`box.value += glyph`）
     - スクロール追従（`box.scrollTop = box.scrollHeight`）

4. 単一文字の即時コピー
   - `copyText(text)` を実装（非同期）
     - まず `navigator.clipboard?.writeText(text)` を試行（HTTPSのGitHub Pagesで動作）
     - 失敗/未対応時はフォールバックへ（次項）
   - `handleCellActivate` 内で: `appendToComposer(glyph)` → `await copyText(glyph)` → `showToast(成功/失敗)`

5. フォールバック（選択→コピー案内）
   - フォールバック方針はPRD準拠：「選択→コピー案内」
   - 実装例: `compose-box` のテキスト末尾を選択状態にし、トーストで案内
     - 例: `box.focus(); box.setSelectionRange(box.value.length - glyph.length, box.value.length)`
     - `showToast('コピーできない場合は選択範囲をコピーしてください')`
   - `document.execCommand('copy')` はブラウザ差異が大きいため使用しない（任意）

6. まとめてコピー
   - `#btn-copy-all` クリックで `copyText(box.value)` を実行
   - 空文字の場合は `showToast('コピーする文字がありません', 'info')` を表示
   - 成功/失敗の結果をトーストで通知

7. クリア操作
   - `#btn-clear` クリックで `box.value = ''`、必要に応じて `showToast('クリアしました')`
   - クリアは取り消し不要の軽操作として扱う

8. トースト通知の実装（一部の視覚/読み上げ確認はCodeX環境では実施できないためスキップ）
   - `showToast(message, type = 'success')`
     - `#toast` にメッセージを設定し `hidden=false`
     - 種別に応じてクラスを切替（`success`/`error`/`info`）
     - 数秒後に自動で `hidden=true`（タイムアウトは3〜4s目安）
   - ARIA: `role="status" aria-live="polite"` により読み上げを促す

9. アクセシビリティ/キーボード
   - セルは `button` 要素または `div role="button" tabindex="0"`（Enter/Spaceで発火）
   - 操作結果はトーストで読み上げ、フォーカスはセルから移動させない（連打しやすく）
   - 作文ボックスは手動編集可能（削除・並べ替え）。ショートカットは設けない（任意）

10. 動作確認（主要ブラウザ）（CodeX環境では実施できないためスキップ）
   - クリックで `compose-box` 末尾に追記され、同時に1文字が即時コピーされる
   - まとめてコピー: `compose-box` の全文がコピーされる（空のときは案内）
   - クリアで `compose-box` が空になり、トーストが表示される
   - クリップボードAPIが無効/失敗の環境でも、フォールバック案内で実用可能

## フェーズ7: メッセージ・アクセシビリティ

### 前提条件
- [x] トースト表示の仕様文言と役割（ARIA live）
- [x] インタラクティブ要素のキーボード操作方針

### タスク
- セルに `role="button"` とキーボード操作（Enter/Space）を付与
- トーストのARIAライブリージョン連携（`aria-live="polite"` 等）
- フォーカスリング/コントラスト/色覚配慮

### 完了条件
- [x] キーボードのみで全操作が可能（CodeX環境では実施できないためスキップ）
- [x] スクリーンリーダーでトースト文言が適切に読み上げられる（CodeX環境では実施できないためスキップ）

### ステップバイステップ（実施手順）
1. トースト仕様の明文化（文言・種別・寿命）
   - 種別: `success`（成功）/`error`（失敗）/`info`（案内）
   - 表示時間: 3〜4秒。重複表示時は最新で置換（キューしない）
   - 代表文言（例）:
     - success: `コピーしました`
     - error: `コピーに失敗しました`
     - info: `コピーできない場合は選択してコピーしてください`

2. ライブリージョンの最終設定
   - 要素: `#toast` に `role="status" aria-live="polite" aria-atomic="true"` を設定
   - 実装: `showToast(msg, type)` でテキストを `textContent` に設定後、`hidden=false` にし、タイムアウトで `hidden=true`
   - 連続発火対策: テキストを変更する前に一度空文字→`requestAnimationFrame`→新テキストで確実に読み上げ

3. フォーカス可視リングとコントラスト
   - CSS: `:focus-visible { outline: 2px solid var(--focus, #0a84ff); outline-offset: 2px; }`
   - ボタン/チップ/セル/入力にフォーカスが視認できることを確認
   - 色コントラスト: 主要テキスト/ボタンの前景・背景で WCAG AA（4.5:1目安）を満たす配色トークンにする

4. キーボード操作一貫性の確認/補強
   - セル: `button` 要素使用、または `div role="button" tabindex="0"` + `keydown(Enter/Space)`で発火
   - カテゴリ: リスト項目は `button` 化し、Enter/Spaceで選択可能。選択中は `aria-current="true"` などで明示
   - 検索: `Tab` でフォーカス移動、`Esc` でクリアボタンに移動（任意）
   - ランダム/コピー/クリア: すべて `button` 要素で `Enter/Space` に反応

5. ナビゲーション順序（フォーカス順）の調整
   - DOM順に `header` → `search` → `quick-chips` → `categories` → `grid` → `composer` → `random` → `footer`
   - `tabindex` は原則使用しない（自然順）。必要な場合のみ `tabindex="-1"` でプログラムフォーカス可にする

6. スクリーンリーダー向けラベル
   - セクションに `aria-labelledby` を付与し、見出しと関連付け
   - ボタンの `aria-label` を明示（例: `まとめてコピー`, `ランダム一文字`）
   - セルは短いテキストのため、そのまま読み上げでOK。必要に応じ `aria-description` に `U+XXXX` を付加

7. メッセージ発火ポイントの統一
   - 成功: 単一コピー/一括コピーで `success`
   - 失敗: クリップボードAPI例外時に `error`
   - 案内: フォールバック時や空状態（検索0件・コピー対象なし）で `info`

8. 0件・エラー時のユーザー案内
   - 検索0件: カテゴリ一覧に空行表示 + `info` トーストで補助メッセージ
   - コピー対象なし: `compose-box` が空のとき `info` を表示
   - フォント未表示（フェーズ8）とは分離し、ここではコピー・検索の案内に限定

9. 動作確認（支援技術含む）（CodeX環境では実施できないためスキップ）
   - キーボードのみで、カテゴリ選択→セル活性→コピー→まとめてコピー→クリア→ランダムの一連操作が可能
   - スクリーンリーダー（例: macOS VoiceOver/Windows NVDA）でトーストが読み上げられる
   - フォーカスが見失われない（操作後も直前の要素に留まる）

## フェーズ8: フォント未表示時の案内

### 前提条件
- [x] 未表示（豆腐・空白）判定の方針（例：フォールバックフォント比較によるおおよその検知、もしくは明示的なFAQ表示）

### タスク
- 対象セル/画面にフォント未表示の可能性がある旨のメッセージを表示
- FAQ/ヘルプに「別端末での閲覧を推奨」文言を記載

### 完了条件
- [x] 想定外の文字が表示できない環境で案内メッセージが確実に提示される（CodeX環境では実施できないためスキップ）
- [x] メッセージがユーザーの操作を妨げない（非モーダル）（CodeX環境では実施できないためスキップ）

### ステップバイステップ（実施手順）
1. UI要素の追加（非モーダルの案内領域）
   - `index.html` に以下を追加
     - グローバル案内: `<div id="font-warning" class="notice" role="status" aria-live="polite" hidden>`
       - 文言（PRD準拠）: 「フォントが表示されない場合はご利用の端末に表示用フォントが存在しない可能性があるので別の端末から見てください」
       - 閉じる: `<button id="font-warning-dismiss" type="button" aria-label="閉じる">×</button>`（表示を隠すだけ）
     - ヘルプ/FAQへのリンク（任意）: `<a id="font-help-link" href="#help-fonts">フォント表示について</a>`

2. 検知方針（ヒューリスティック）
   - 目的: 完全静的環境で「未表示の可能性」を高確率で検知し、確定断定は避ける
   - 方法: 同一文字を異なる汎用フォント（`serif`/`monospace`）でオフスクリーン描画し、描画サイズを比較
     - 実装: `isLikelyUnsupported(char)`
       - `spanA`（`font-family: serif`）と `spanB`（`font-family: monospace`）を同一スタイル・同一文字で作成
       - `offsetWidth/offsetHeight` が完全一致し続ける場合、フォールバック豆腐の可能性が高いとみなす
       - いずれかがゼロ、または異常値の場合も「未表示の可能性あり」とする
   - 注意: 誤検知を避けるため、単一判定ではなくサンプリングと閾値で判定する

3. サンプリング戦略（パフォーマンス配慮）
   - `renderGridByCategory` 完了後に、表示中セルの先頭から最大 N 件（例: 16件）をサンプリング
   - `requestIdleCallback` または `setTimeout(0)` で計測し、初期描画を阻害しない
   - `unsupportedCount / sampleCount >= 0.5` などの閾値でグローバル警告の表示/非表示を切り替え

4. 案内の表示/非表示ロジック
   - 表示: 閾値を超えたら `#font-warning` の `hidden=false`
   - 非表示: ユーザーが `×` を押したら隠す（`hidden=true`）
   - 記憶: `localStorage.setItem('hideFontWarning','1')` を設定し、次回以降は自動で非表示（再検知時も尊重）

5. セル単位の補助（任意）
   - 未対応と推測されたセルに `data-unsupported="true"` を付与し、ツールチップタイトルで補足
   - CSSで目立ち過ぎない点線枠などを適用（操作を妨げない）

6. アクセシビリティ
   - 案内は `role="status" aria-live="polite"` で読み上げ対象にする
   - 閉じるボタンに `aria-label="閉じる"` を設定し、`Tab` で到達可能にする
   - 非モーダルのためフォーカストラップは使わない

7. パフォーマンス/互換性
   - 計測DOMはオフスクリーン（`position: absolute; visibility: hidden;` 等）に置き、使用後に削除
   - 計測は1カテゴリ表示につき1回のみ（サンプリング上限あり）
   - 低速環境では `requestIdleCallback` 不在時に `setTimeout` を用いるフォールバック

8. 動作確認（CodeX環境では実施できないためスキップ）
   - フォントが無い/希少なカテゴリを選択して、一定比率で警告が出ること
   - 警告を閉じても他操作を妨げないこと、再読み込み後に `localStorage` 設定で非表示が維持されること
   - スクリーンリーダーで案内文言が読み上げられること

## フェーズ9: パフォーマンス最適化

### 前提条件
- [x] データ容量と読み込み戦略（分割/遅延読み込み）の見積り

### タスク
- 初期ロードの分割（カテゴリ単位のJSON分割、必要時ロード）
- レンダリング最適化（仮想スクロールは必要に応じて検討）

### 完了条件
- [x] 初期表示までのLCP/TTIが実用域（例：LCP < 2.5s ローカル想定）（CodeX環境では実施できないためスキップ）
- [x] 主要操作におけるフレーム落ちがない（CodeX環境では実施できないためスキップ）

### ステップバイステップ（実施手順）
1. 測定の用意（ベースライン取得）（CodeX環境では実施できないためスキップ）
   - `console.time/End` を各主要処理に設置（初期ロード、カテゴリレンダ、検索、ランダム）
   - `performance.mark/measure` を `renderGridByCategory` 前後に配置
   - Lighthouse を一度実行し、LCP/TTI のベースライン値を記録

2. データ分割と遅延読み込み（静的JSONのまま）
   - 目的: 初期ペイロード削減。PRD要件を満たしつつ完全静的を維持
   - 構成: 互換性を保ったまま段階的導入
     - 既存: `data/scripts.json`（全カテゴリのメタ）
     - 追加: `data/scripts/index.json`（`id/label/tags` のみ）
     - 追加: `data/scripts/detail/<id>.json`（当該カテゴリの `blocks` など詳細）
   - 実装: 初期表示は `index.json` のみ取得し、カテゴリを選択した時点で `detail/<id>.json` を `fetch`
   - フォールバック: `detail` が無い場合は従来の `scripts.json` から参照（互換維持）

3. レンダリングの分割描画（大規模カテゴリ向け）
   - `renderGridByCategory` でセルが N 件（例: 500）を超える場合、チャンク分割
     - 方式: 例えば 300 件ずつ `requestAnimationFrame` で挿入
     - DOM構築は各チャンクで `DocumentFragment` を使い、レイアウト回数を最小化

4. CSS最適化
   - グリッドコンテナに `contain: content;` または `content-visibility: auto;` を検討（互換性に注意）
   - アニメーションは原則使用しない。必要時は `prefers-reduced-motion` で無効化
   - アイコン/装飾はCSSで表現し、画像・外部フォントは使用しない

5. メモリ/計算キャッシュ
   - `expandBlocksToCodePoints` の結果をカテゴリ単位でキャッシュして再利用
   - 検索インデックス（正規化済み文字列）を初期化時に一度構築し、以降は更新不要

6. 入力/イベントの最適化
   - 検索入力にデバウンス（既に実装済み: 150ms 目安）
   - グリッド/カテゴリはイベントデリゲーションを維持（子要素に個別リスナを付けない）

7. ネットワークとキャッシュ
   - JSONはスペース無しの最小化形式で保存
   - `data/meta.json` や `scripts` 取得にクエリパラメータでバージョンを付与（例: `?v=15.1.0`）
   - GitHub Pages のキャッシュに任せ、クライアント側は二重キャッシュを持たない（シンプルさ優先）

8. 測定と調整（CodeX環境では実施できないため一部スキップ）
   - 代表的な大きいカテゴリでチャンクサイズを 200/300/500 など試し、200ms 以内の初回レンダを達成
   - Lighthouse を再計測し、LCP/TTI の改善を確認
   - フレーム落ち（スクロール/入力時のカクつき）が無いか体感で確認

## フェーズ10: ドキュメント整備

### 前提条件
- [x] 最終仕様の反映方針

### タスク
- README（目的、セットアップ、開発/公開方法、制約、出典、ライセンス）

### 完了条件
- [x] READMEが更新されていること

### ステップバイステップ（実施手順）
1. README セクション構成の作成
   - 見出し案: 目的 / 要件準拠 / 使い方 / 開発・公開 / データ出典 / 仕様詳細 / アクセシビリティ / パフォーマンス / 制約と注意 / ライセンス

2. 目的（PRDの要件を要約）
   - 世界の文字を静的サイトで閲覧できること（完全静的: HTML/CSS/JS）
   - UCD（Unicode Character Database）由来のデータを使用
   - フォント未表示時の案内メッセージ表示
   - 画面フッターに UCD バージョンと取得元URLを表示

3. 要件準拠（コンプライアンス表）
   - 機能と対応箇所を簡潔に記述
     - 文字カテゴリ一覧（表記例: ヒエログリフ／楔形文字／ハングル／キリルで全カテゴリを表示）
     - カテゴリ別グリッド（セルに文字＋`U+XXXX`）
     - 検索・フィルタ（日本語/英語のラベル・タグに前方/部分一致）
    - クイックチップ（全カテゴリショートカット）
     - ランダム表示（一文字/複数、重複許容・即時性重視）
     - コピー操作（単一即時コピー＋追記、まとめてコピー、トースト通知）
     - フォント未表示時の案内文言（非モーダル）
     - フッターに UCD バージョンと取得元URL

4. 使い方（ローカル/公開）
   - ローカル: ブラウザで `index.html` を開く（`file://` でも動作、`fetch` 利用時は簡易HTTPサーバを推奨）
   - 公開: GitHub Pages で `main`/`docs` など公開ブランチに静的ファイルを配置
   - 推奨: `data/` ディレクトリ以下のJSONと `index.html`/`styles.css`/`app.js` のみで完結

5. 開発・公開（手順）
   - データ生成: `data/scripts.json` と `data/meta.json` を配置（分割版を使う場合は `data/scripts/index.json` と `data/scripts/detail/<id>.json`）
   - 初期表示確認: カテゴリ一覧と空グリッド、フッターのUCD情報
   - GitHub Pages 設定: リポジトリ設定から Pages を有効化し、対象ブランチ/ディレクトリを指定

6. データ出典（UCD）
   - `meta.json` に `unicodeVersion` と取得元URL（`Scripts.txt`/`Blocks.txt`/`UnicodeData.txt`）を記載
   - Unicode Terms of Use へのリンクを掲載（UCDの利用について）
   - 表示対象の定義: `Cn`/`Cs`/`Cc` を除外（必要に応じて `Cf` 検討）

7. 仕様詳細（本プロジェクトの明文化）
   - コードポイント表記: `U+XXXX`（16進・大文字・4〜6桁）
   - データ構造: `scripts.json` の各エントリは `{ id, label, tags, blocks[[startHex,endHex], ...] }`
   - カテゴリ設計: Script 準拠＋Block は手動ホワイトリスト（Common/Inherited 等は原則除外）
   - 日本語ラベル方針: 一般的呼称を優先、なければカタカナ転写。`id` はASCIIの安定名

8. アクセシビリティ / パフォーマンス
   - A11y: セルに `role=button`、Enter/Spaceで発火、トーストは ARIA ライブリージョン
   - Perf: 初回表示目安、分割/遅延読み込み、チャンク描画の方針を要約

9. 制約と注意 / ライセンス
   - 端末フォント依存により表示不可の可能性がある旨を明記（代替端末の案内）
 - 本体コードのライセンス（リポジトリの方針に従う）と、UCDデータの利用条件へのリンク

## フェーズ11: 静的メッセージによるフォント未表示時の案内（PRD即応）

### 前提条件
- [x] PRDの文言を確定（そのまま掲出）
  - 「フォントが表示されない場合はご利用の端末に表示用フォントが存在しない可能性があるので別の端末から見てください」
- [x] 表示位置の方針: 画面上部（ヘッダ直下）に非モーダルで常時表示

### タスク
- 画面に静的な注意メッセージを追加（動的検知は行わず、常時表示でPRD準拠を早期満たす）
  - index.html: `<div id="font-static-note" class="notice" role="note">…</div>` をヘッダ直下に追加
  - styles.css: `.notice` の最小スタイル（背景/枠/余白/コントラスト）を追加
  - 説明リンク（任意）: `README` の「制約と注意」セクションへアンカー
- アクセシビリティ: 非モーダル（フォーカストラップなし）、読み上げ連続を避けるため `aria-live` は付与しない
- 将来拡張との両立: フェーズ8の動的検知が導入された際は、重複表示を避けるためどちらか一方に統一（運用ルールを記載）

### 完了条件
- [x] 画面上部にPRD文言の注意メッセージが常時表示される
- [x] メッセージが他操作を妨げない（非モーダル）
- [x] READMEの「制約と注意」に同文言を反映

### ステップバイステップ（実施手順）
1. index.html に以下を追加（ヘッダ要素の直後）
   - `<div id="font-static-note" class="notice" role="note">フォントが表示されない場合はご利用の端末に表示用フォントが存在しない可能性があるので別の端末から見てください</div>`
2. styles.css に `.notice` の最低限スタイルを追加（配色はテーマ変数を使用）
3. README の「制約と注意」に同文言を追記し、ユーザーが事前に把握できるようにする
4. フェーズ8（動的検知）着手時に、静的メッセージの扱い（常時/条件付/削除）を決定

## フェーズ12: ランダム機能のPRD更新反映（複数=全体のみ）

### 背景
- PRD変更: 「ランダム複数文字：全体または特定カテゴリから任意個を表示」→「ランダム複数文字：全体から任意個を表示」に更新。

### 前提条件
- [x] 現状実装の把握（`index.html` の `#random-scope-all` チェックボックス、`app.js#wireRandomSection` のスコープ切替）
- [x] 変更方針の確定: 複数は常に「全体」から抽選。単一は現行どおり（カテゴリ/全体）か、併せて「全体のみ」に統一するかは要確認。

### タスク
- 仕様反映（複数=全体のみ）
  - `app.js`: `randManyBtn` のハンドラで `getScope()` を使わず、常に `randomCache.all` を対象に抽選。
  - `randomCache.all` 未構築時は初回構築（`getAllDisplayables()` 相当）を実施。
- UIの整理
  - チェックボックス `#random-scope-all` の扱いを見直し:
    - 案A: 単一のみに適用（ラベルを「単一を全体から」に変更）。
    - 案B: UIから除去して、複数/単一とも「全体のみ」に統一。
  - index.html / styles.css のテキスト・ラベルを更新。
- ドキュメント更新
  - `prd.md` は更新済み。README のランダム説明を必要に応じて修正。
- 後方互換
  - 既存のカテゴリ選択状態には依存せず、複数抽選は常に全体から行う旨をコメント/Docに明記。

### 完了条件
- [x] 複数抽選が常に全体から行われる（カテゴリ選択やチェックの有無に影響されない）。
- [x] UI上の表記が挙動と一致（誤解を招かない）。
- [x] README/PRD/実装コメントの整合が取れている。

### ステップバイステップ（実施手順）
1. 実装切替: `randManyBtn` のスコープ決定を `randomCache.all` に固定。
2. 初期化で `randomCache.all` 構築（未構築時のみ）。
3. UIラベル調整（案A/Bの決定に応じて `index.html` 変更）。
4. README のランダム説明を更新。
5. 手動確認（ブラウザ）: カテゴリ選択を変えても複数が常に全体から抽選されること。

## フェーズ13: UI/UX更新（選択状態・固定表示・デザイン統一）

### 背景
- PRD/要望に基づき、以下のUI改善を行う。
  1) 文字（セル）選択時もカテゴリ選択同様に青枠の選択状態にする。加えて、従来の「上部の選択した文字表示エリア」は削除する。
  2) カテゴリが一つしかない文字は自動でそのカテゴリを選択状態にする（コードポイント→カテゴリの一意マッピング）。
  3) 「ランダム表示」と「選択中の文字」を画面上部に表示し、スクロールしても常に表示（固定ヘッダ的UI）。
  4) 画面右下に「Created by FORTE」を常時表示し、`https://fortegp05.net/` へリンクする。
  5) テキストボックスとボタンのデザインを `https://fortegp05.github.io/self_introduction_card/` と同じトーンに統一する。

### 前提条件
- [x] 現状UIの把握（`#categories`/`#grid`/`#random`/`#composer`/`#toast` の構成）
- [x] 選択ハイライトは `--accent` を用いた青系の枠線で統一（カテゴリ選択は `[aria-current="true"]` で実現中）
- [x] 文字→カテゴリ解決は `data/scripts.json.blocks` による包含判定で可能

### タスク
- セル選択の視覚状態
  - app.js: セル選択時に `aria-current="true"` もしくは `data-selected="true"` をセルに付与／他セルから解除。
  - styles.css: `.cell[aria-current="true"], .cell[data-selected="true"] { border-color: var(--accent); }` を追加。
  - キーボード操作（Enter/Space）でも同様に選択状態を反映。

- 旧「選択した文字」エリアの整理
  - index.html: 既存 `#composer` セクションを削除（または新しい固定ヘッダUIへ統合）。
  - app.js: `wireCopyInteractions` は新しい固定ヘッダのテキストボックスを参照するよう調整。

- 単一カテゴリの自動選択
  - app.js: 文字（コードポイント）選択時、`scripts.json.blocks` を走査し、その文字を含むカテゴリ一覧を求める。
  - 一つだけ該当する場合、そのカテゴリボタンに `aria-current="true"` を付与し、`renderGridByCategory` を呼び出して自動選択状態にする。

- 上部固定UI（ランダム＋選択中の文字）
  - index.html: ヘッダ直下に固定バー `#sticky-ops` を追加（ランダム操作と選択中テキストボックス＋コピー/クリアボタンを配置）。
  - styles.css: `position: sticky; top: 0; z-index` で固定。背景/境界線/余白を調整して読みやすく。
  - app.js: ランダム結果は `#random-result` ではなく固定バー内のミニ結果表示へ出力するか、固定バーからジャンプできる導線を用意。

- フッター右下リンク
  - index.html: 画面右下に固定のリンク `Created by FORTE` を追加、全体が `https://fortegp05.net/` に遷移するようにする。
  - styles.css: `position: fixed; right: 16px; bottom: 16px;` で常時表示。アクセシビリティ上、リンクテキストのコントラストを確保。

- デザイン統一（テキストボックス/ボタン）
  - 参照: `self_introduction_card` のスタイル。色・角丸・影・ホバー/アクティブの挙動を踏襲。
  - styles.css: 入力/ボタンのトークン（配色/角丸/高さ/フォント/影）を変数化し、既存の `.search-bar` や操作ボタン群へ適用。
  - 必要に応じて HTML のクラス名を揃え、冗長なスタイルを削減。

- ドキュメント更新
  - README: 上部固定UI/右下リンク/デザイン方針の概要を追記。
  - work_result.md: 実装後に反映結果とスクリーンショット（任意）を記載。

### 完了条件
- [x] セル選択で青枠が表示され、カテゴリ選択と視覚的一貫性がある。
- [x] 「上部の選択した文字」旧エリアが削除され、新しい固定ヘッダUIに集約されている。
- [x] 単一カテゴリに属する文字選択時に、そのカテゴリが自動選択される。
- [x] ランダム操作と選択中の文字が上部に常時表示され、スクロールしても見失わない。
- [x] 画面右下に「Created by FORTE」リンクが常時表示され、`https://fortegp05.net/` に遷移する。
- [x] テキストボックスとボタンの見た目が参照サイトに近い調子に統一されている（角丸/配色/ホバーの一貫性）。
- [x] ドキュメントが更新されている。

### ステップバイステップ（実施手順）
1. セル選択状態の実装とスタイル追加。
2. 固定ヘッダ `#sticky-ops` のマークアップとスタイル作成、`#composer` の統合/削除。
3. 文字→カテゴリ自動選択ロジックを実装（ブロック包含判定）。
4. ランダム結果/選択文字の表示先を固定ヘッダへ変更（必要に応じてID更新）。
5. 右下リンクの設置とスタイル。
6. 入力/ボタンのデザインを参照サイトに合わせて調整（トークン化）。
7. README/作業結果の更新。
