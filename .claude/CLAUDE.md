# markdown2image 設計ドキュメント

- このドキュメント以外のドキュメントは [./memories](./memories) に保存する

## 1. 要件定義

| 項目 | 内容 |
|------|------|
| 目的 | Markdownドキュメントを画像に変換する |
| 対象ユーザー | Markdownでドキュメントを書く開発者・技術者 |
| 実行環境 | ブラウザ完結型ウェブアプリ（サーバー不要） |
| 出力形式 | SVG（主）、PNG（2倍スケール高解像度） |
| レンダリング方式 | Canvas APIでテキスト計測、SVG DOM構築で出力 |
| Markdown対応範囲 | GFMフル対応（テーブル・タスクリスト・注釈含む） |
| スタイル | 固定スタイル（カスタマイズ不要） |
| 技術スタック | Vite + TypeScript（UIフレームワークなし） |

### 1.1 成功の判定基準

- Markdownテキストを入力するとSVGプレビューがリアルタイム表示される
- SVGファイルとしてダウンロードできる
- PNGファイルとしてダウンロードできる
- 日本語テキストが正しく表示される
- GFMの主要要素（見出し・段落・リスト・コードブロック・テーブル・引用・画像・注釈）が描画される

## 2. アーキテクチャ

### 2.1 全体構成

```
[入力] Markdownテキスト（テキストエリア）
    │
    ▼
[パーサー層] unified + remark-parse + remark-gfm
    │         → mdast (Markdown AST)
    ▼
[レイアウト層] LayoutEngine
    │  ・mdast ASTを走査
    │  ・各ノードをLayoutBox（位置・サイズ・スタイル情報）に変換
    │  ・テキスト折り返し: 非表示Canvasの measureText() で文字幅計測
    │  ・ブロック要素の垂直配置計算
    │  ・テーブルの列幅自動計算
    │  ・shikiによるコードブロックのトークナイズ
    │  → LayoutTree（描画可能なレイアウトツリー）
    ▼
[画像解決] resolveImages
    │  ・LayoutBox内の画像URLをfetchしてBase64 data URIに変換
    │  ・キャッシュにより同一URLの再フェッチを防止
    ▼
[レンダラー層]
    ├── SvgRenderer: LayoutTree → SVG文字列
    │     <text>, <rect>, <line>, <image> 等のSVG要素を生成
    └── svgToPng: SVG文字列 → Canvas描画 → PNG Blob (2倍スケール)
    │
    ▼
[出力] SVGファイルダウンロード / PNGファイルダウンロード
```

### 2.2 ディレクトリ構造

```
src/
  lib/markdown2image/     # コア変換ライブラリ（コピーで再利用可能）
    index.ts              # 公開APIファサード + 依存パッケージ情報
    image-resolver.ts     # 画像URL→Base64 data URI解決
    types/
      layout.ts           # LayoutBox, TextSpan, BoxStyle等の型定義
      renderer.ts         # Renderer / CodeHighlighter インターフェース
      theme.ts            # Theme, ThemePreset, ThemeConfig, DeepPartial 型定義
    theme/
      resolve.ts          # resolveTheme(), deepMerge()
      presets/
        github-light.ts   # GitHub Light テーマプリセット
        github-dark.ts    # GitHub Dark テーマプリセット
    parser/
      markdown.ts         # Markdown → mdast パース
    layout/
      engine.ts           # レイアウトエンジン本体
      measure.ts          # テキスト計測（Canvas measureText）
      style.ts            # StyleFactory + テーマ対応スタイル定義
    renderer/
      svg.ts              # SVGレンダラー
      png.ts              # SVG → Canvas → PNG変換
  ui/
    app.ts                # UIロジック (デバウンス・ダウンロード)
  main.ts                 # エントリポイント
index.html                # HTML + CSS
public/
  sample.svg              # サンプル画像
```

### 2.3 データフロー

統合関数 `markdownToSvg(markdown, options?)` / `markdownToPng(markdown, options?)` が
ステップ 2〜6 を内部で実行する。個別クラスの直接利用も可能である。

1. ユーザーがテキストエリアにMarkdownを入力する（200msデバウンス）
2. テーマ設定を解決する（プリセット名 or 部分上書き → 完全な Theme オブジェクト）
3. パーサーがMarkdownをmdast ASTに変換する
4. レイアウトエンジンがASTを走査しLayoutBoxツリーを生成する（テーマ適用）
5. 画像URLをfetchしBase64 data URIに変換してLayoutBoxに設定する
6. SVGレンダラーがLayoutBoxツリーからSVG文字列を生成する（テーマ適用）
7. UIがSVGをプレビュー表示する
8. ユーザーがダウンロードボタンでSVG/PNGを保存する

## 3. ドメインモデル

### 3.1 レイアウトツリー

```typescript
type LayoutBox = {
  type: LayoutBoxType
  x: number
  y: number
  width: number
  height: number
  style: BoxStyle
  children: LayoutBox[]
  lines?: TextLine[]
  depth?: HeadingDepth      // heading の場合
  marker?: string           // list-item の場合
  src?: string              // image の場合 (Base64 data URI)
  alt?: string              // image の場合
  language?: string         // code-block の場合
  code?: string             // code-block の場合
}

type LayoutBoxType =
  | 'document'
  | 'heading'
  | 'paragraph'
  | 'code-block'
  | 'blockquote'
  | 'list'
  | 'list-item'
  | 'table'
  | 'table-row'
  | 'table-cell'
  | 'image'
  | 'hr'
  | 'footnote'
```

### 3.2 テキスト表現

```typescript
type TextSpan = {
  text: string
  style: SpanStyle
  width?: number   // measureTextで計測した正確な幅 (px)
}

type SpanStyle = {
  bold: boolean
  italic: boolean
  code: boolean
  strikethrough: boolean
  link?: string
  color: string
  fontFamily: string
  fontSize: number
}

type TextLine = {
  spans: TextSpan[]
  width: number
  height: number
}
```

### 3.3 スタイル

```typescript
type BoxStyle = {
  fontFamily: string
  fontSize: number
  lineHeight: number
  color: string
  backgroundColor?: string
  borderColor?: string
  padding: Spacing
  margin: Spacing
}

type Spacing = {
  top: number
  right: number
  bottom: number
  left: number
}
```

### 3.4 レンダラーインターフェース

```typescript
interface Renderer {
  render(layout: LayoutBox): string | Promise<string>
}
```

## 4. 技術スタック

| 用途 | ライブラリ | バージョン | 備考 |
|------|-----------|-----------|------|
| Markdownパース | unified + remark-parse | unified 9.x, remark-parse 9.x | CJS対応版 |
| GFM拡張 (テーブル・タスクリスト) | remark-gfm | 1.x | CJS対応版 (micromark v2) |
| 脚注 | LayoutEngine自前処理 | — | definition/linkReference ノードから検出 |
| シンタックスハイライト | CodeHighlighterインターフェース | — | shikiバージョン非依存 |
| ビルド | Vite | 7.x | ウェブアプリ側 |
| 言語 | TypeScript | 5.x | |

### 4.1 CJS対応について

unified v10+ / remark-gfm v3+ / shiki v1+ は ESM only のため CJS プロジェクトで require() できない。
コア変換ライブラリ (src/lib/markdown2image/) は CJS 対応バージョンの依存パッケージを使用し、
ESM / CJS どちらのプロジェクトにもコピーして利用できるようにしている。

shiki については独自の CodeHighlighter インターフェースで抽象化し、
ライブラリ自体が shiki パッケージに実行時依存しない設計とした。
呼び出し側が好みのバージョン（ESM: v1+, CJS: v0.x）を初期化して注入する。

## 5. 対応要素

### 5.1 ブロック要素

| 要素 | 対応状況 |
|------|----------|
| 見出し (h1-h6) | 対応済み |
| 段落 | 対応済み (テキスト折り返し・CJK文字分割含む) |
| コードブロック | 対応済み (shikiによる22言語のシンタックスハイライト) |
| 引用ブロック | 対応済み (ネスト対応) |
| リスト (ul/ol) | 対応済み |
| タスクリスト | 対応済み (チェックボックス文字) |
| テーブル | 対応済み (列幅自動計算・ヘッダー背景) |
| 水平線 | 対応済み |
| 画像 | 対応済み (Base64 data URI埋め込み) |
| 脚注 | 対応済み (ドキュメント末尾に区切り線付き表示) |

### 5.2 インライン要素

| 要素 | 対応状況 |
|------|----------|
| 太字 | 対応済み |
| 斜体 | 対応済み |
| インラインコード | 対応済み (背景矩形付き) |
| リンク | 対応済み (下線付き) |
| 取り消し線 | 対応済み |
| 脚注参照 | 対応済み (上付き数字) |
| インライン画像 | 対応済み (altテキスト表示) |

### 5.3 シンタックスハイライト対応言語

TypeScript, JavaScript, Python, Rust, Go, Java, C, C++, C#, HTML, CSS, JSON, YAML, TOML, Markdown, Bash, Shell, SQL, Ruby, PHP, Swift, Kotlin

## 6. 実装経緯

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1 | 基本構造 (パーサー・レイアウト・SVGレンダラー・UI) | 完了 |
| Phase 2 | インライン要素の精度向上 (measureText正確値・リンク下線) | 完了 |
| Phase 3 | shikiによるシンタックスハイライト (22言語) | 完了 |
| Phase 4 | テーブル・画像埋め込み・脚注 | 完了 |
| Phase 5 | PNG出力 (2倍スケール)・UI仕上げ (レスポンシブ対応) | 完了 |
| Phase 6 | テーマシステム (github-light/github-dark プリセット、部分上書き) | 完了 |

## 7. テスト

- テストフレームワーク: Jest + ts-jest（Node.js環境）
- テスト対象: `src/lib/markdown2image/` コア変換ライブラリ（png.ts を除く）
- テスト数: 9スイート / 210テスト
- 詳細: [./memories/TESTING.md](./memories/TESTING.md)

```bash
npm test              # 全テスト実行
npm run test:watch    # ウォッチモード
npx jest --coverage   # カバレッジ付き実行
```

## 8. デプロイ

- 配信先: GitHub Pages（https://sato1043.github.io/markdown2image/）
- ビルド・公開: GitHub Actions（`develop` への push で自動実行）
- Node バージョン: `.node-version` を単一の定義としてローカルの fnm と CI が共有する
- base path: project site 配下に置くため `vite.config.ts` の `base` を固定する
- 詳細: [./memories/DEPLOYMENT.md](./memories/DEPLOYMENT.md)

## 9. 既知の制約・今後の改善候補

| 項目 | 状態 | 備考 |
|------|------|------|
| テキスト折り返しの精度 | 基本動作 | WebFontロード完了前に計測すると誤差が生じる可能性がある |
| 日本語の禁則処理 | 未実装 | 行頭・行末の禁則文字処理は未対応 |
| 画像の実サイズ取得 | 未実装 | 画像は固定高さ(200px)のプレースホルダーで表示する |
| テーブルセル内の折り返し | 基本動作 | 長いテキストは折り返すが、複雑なインライン要素のネストは未検証 |
| スタイルのカスタマイズ | 対応済み | テーマシステム: `github-light` / `github-dark` プリセット、部分上書き対応。UI選択は未実装 |
| 数式 (KaTeX/MathJax) | 未実装 | 将来の拡張候補 |

