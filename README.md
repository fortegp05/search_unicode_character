# 世界の文字ビューア（Search Unicode, static viewer）

Unicode Character Database（UCD）由来のデータを用いて、世界各地の文字を完全静的（HTML/CSS/JS）で閲覧できるビューアです。

## 目的

- 世界の文字カテゴリを一覧し、カテゴリ別にグリッドで閲覧できること
- データは UCD に準拠し、出典とバージョンを明示すること
- 端末に表示用フォントがない場合の注意喚起を行うこと
- 画面フッターに UCD バージョンと取得元URLを表示すること

## 要件準拠

- 文字カテゴリ一覧: 全てのカテゴリを表示（例: ヒエログリフ／楔形文字／ハングル／キリル）
- カテゴリ別グリッド: 各セルに「文字＋`U+XXXX`」表記で表示
- 検索・フィルタ: 日本語/英語のラベル・タグで前方/部分一致
- クイックチップ: 全カテゴリをワンクリックで選択
- ランダム表示: 一文字・複数（重複許容、即時性重視）
- コピー操作: セル選択で末尾に追記＋単一コピー、まとめてコピー、トースト通知
- フォント未表示の案内: ヘッダ直下に注意メッセージを常時表示
- フッター: UCD バージョンと取得元URLを表示

## 使い方

- ローカル閲覧: `index.html` をブラウザで開きます（`fetch` を利用するため簡易HTTPサーバ推奨）
- 開発用サーバ: `node tools/dev_server.mjs --port 8080` を実行し `http://127.0.0.1:8080/` を開く
- npm スクリプト: `npm start` で同等のローカルサーバを起動
- 公開: GitHub Pages などに `index.html`/`styles.css`/`app.js` と `data/` を配置

## 開発・公開

- データ配置: `data/scripts.json`（カテゴリ定義）、`data/meta.json`（UCDメタ）
- 生成物: `data/generated/` に補助JSON（Script↔Block、表示可能マップなど）
- 初期表示: カテゴリのクイックチップ、空のグリッド、フッターのUCD情報
- GitHub Pages: リポジトリ設定から Pages を有効化し、対象ブランチ/ディレクトリを指定

## データ出典（UCD）

- UCD version: 16.0.0
- Originals at repo root: `Blocks.txt`, `Scripts.txt`, `UnicodeData.txt`
- Sources:
  - https://www.unicode.org/Public/16.0.0/ucd/Blocks.txt
  - https://www.unicode.org/Public/16.0.0/ucd/Scripts.txt
  - https://www.unicode.org/Public/16.0.0/ucd/UnicodeData.txt

## 仕様詳細

- コードポイント表記: 大文字16進 `U+XXXX`（4〜6桁）
- データ構造: `scripts.json` の各要素は `{ id, label, tags, blocks[[startHex,endHex], ...] }`
- カテゴリ設計: Script 準拠＋ Block は手動ホワイトリストで明示（Common/Inherited 等は原則除外）
- 日本語ラベル方針: 一般的呼称を優先、なければカタカナ転写。`id` はASCIIの安定名
- 表示対象の定義: General_Category が `Cn`/`Cs`/`Cc` を除外（必要に応じて `Cf` 検討）

## アクセシビリティ

- セルはボタン相当（`role="button"`）、Enter/Space で発火
- トーストは `role="status" aria-live="polite"` で通知
- ランドマーク: `header`/`main`/`footer` を使用、各セクションに `aria-labelledby` を付与

## パフォーマンス

- 大規模カテゴリはチャンク描画（`requestAnimationFrame`）で段階的に追加
- 乱数抽選は事前展開・キャッシュで即時性を確保
- 初回レンダ 200ms 以内を目安（実測はブラウザで確認）

## 制約と注意

- 端末に表示用フォントが存在しない場合、文字が表示されないことがあります。
  その場合は「フォントが表示されない場合はご利用の端末に表示用フォントが存在しない可能性があるのでフォントをダウンロードするか、別の端末から見てください」。
  画面上部にも同旨の注意書きを常時表示しています。
- クリップボードAPIが利用できない環境では、選択→コピーのフォールバック案内を表示します。

## ライセンス / 利用条件

- ソフトウェア: Apache License 2.0（`LICENSE` を参照）
- Unicode データの利用条件: https://www.unicode.org/terms_of_use.html

---

補足
- UI: ランダム表示と選択中の文字は上部の固定バーに集約。画面右下に「Created by FORTE」リンクを表示。
- データ/生成手順の詳細は `data/README.md` も参照してください。
