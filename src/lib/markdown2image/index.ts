/**
 * markdown2image — Markdown を SVG / PNG 画像に変換するライブラリ
 *
 * このディレクトリを別の TypeScript プロジェクトにコピーして利用できる。
 * ESM / CommonJS どちらのプロジェクトでも動作する。
 *
 * ## 必要な依存パッケージ
 *
 * unified v10+ / remark-gfm v3+ は ESM only のため、
 * CommonJS プロジェクトでも動作するよう CJS 対応バージョンを使用する。
 *
 * ```bash
 * npm install unified@9 remark-parse@9 remark-gfm@1
 * npm install --save-dev @types/mdast
 * ```
 *
 * | パッケージ       | バージョン | 備考                                          |
 * |------------------|-----------|-----------------------------------------------|
 * | unified          | 9.x       | CJS 対応の最終メジャー                        |
 * | remark-parse     | 9.x       | CJS 対応の最終メジャー（micromark v2）        |
 * | remark-gfm       | 1.x       | remark-parse v9 / micromark v2 対応版         |
 * | @types/mdast     | 4.x       | AST 型定義（devDependency）                   |
 *
 * ### 脚注について
 *
 * remark-footnotes は remark-parse v9 と API 非互換のため使用しない。
 * 代わりに remark-parse v9 が `[^1]` を linkReference (identifier: "^1")、
 * `[^1]: 内容` を definition (identifier: "^1", url: "内容") として解析する
 * 仕様を利用し、LayoutEngine が脚注を自前で処理する。
 *
 * ### シンタックスハイライト（オプション）
 *
 * コードブロックのシンタックスハイライトを有効にする場合は、
 * 呼び出し側で Highlighter を初期化し LayoutEngine.setHighlighter() に渡す。
 * ライブラリ自体は shiki に実行時依存しない（CodeHighlighter インターフェースで抽象化済み）。
 *
 * - ESM プロジェクト: shiki v1+ を使用可能
 * - CJS プロジェクト: shiki v0.x（CJS 対応版）を使用
 *
 * ```bash
 * # ESM プロジェクトの場合
 * npm install shiki
 *
 * # CJS プロジェクトの場合
 * npm install shiki@0
 * ```
 *
 * ## tsconfig.json に必要な設定
 *
 * - "target": "ES2022" 以上
 * - "module": "CommonJS" / "ESNext" / "Node16" いずれも可
 * - "moduleResolution": "node" / "bundler" / "node16" いずれも可
 * - "lib": ["ES2022", "DOM"] — Canvas API / FileReader API を使用するため
 *
 * ## ブラウザ API 依存
 *
 * 以下のモジュールはブラウザ環境（DOM API）を必要とする:
 * - layout/measure.ts — Canvas 2D API（テキスト幅計測）
 * - renderer/png.ts — Canvas / Image / Blob API（SVG → PNG 変換）
 * - image-resolver.ts — fetch / FileReader API（画像の Base64 埋め込み）
 *
 * ## 基本的な使い方
 *
 * ```typescript
 * import {
 *   parseMarkdown,
 *   LayoutEngine,
 *   SvgRenderer,
 *   resolveImages,
 *   svgToPng,
 * } from './lib/markdown2image'
 *
 * // 1. Markdown → AST
 * const ast = parseMarkdown('# Hello\n\nworld')
 *
 * // 2. AST → LayoutBox（オプション: シンタックスハイライト）
 * const engine = new LayoutEngine()
 * // engine.setHighlighter(highlighter) // CodeHighlighter インターフェース準拠のオブジェクト
 * const layout = engine.layout(ast)
 *
 * // 3. 画像 URL を Base64 data URI に変換（画像を含む場合）
 * await resolveImages(layout)
 *
 * // 4. LayoutBox → SVG 文字列
 * const renderer = new SvgRenderer()
 * const svg = renderer.render(layout)
 *
 * // 5. SVG → PNG（オプション）
 * const pngBlob = await svgToPng(svg)
 * ```
 */

// --- 型定義 ---
export type {
  Spacing,
  BoxStyle,
  SpanStyle,
  TextSpan,
  TextLine,
  LayoutBoxType,
  HeadingDepth,
  LayoutBox,
} from './types/layout'

export type { Renderer, CodeHighlighter } from './types/renderer'

// --- パーサー ---
export { parseMarkdown } from './parser/markdown'

// --- レイアウト ---
export { LayoutEngine } from './layout/engine'
export { TextMeasurer } from './layout/measure'
export {
  DOCUMENT_WIDTH,
  DOCUMENT_PADDING,
  CONTENT_WIDTH,
  TABLE_CELL_PAD_H,
  documentStyle,
  headingStyle,
  paragraphStyle,
  codeBlockStyle,
  blockquoteStyle,
  listStyle,
  listItemStyle,
  hrStyle,
  tableStyle,
  tableCellStyle,
  imageStyle,
  footnoteBlockStyle,
  defaultSpanStyle,
  inlineCodeSpanStyle,
  linkSpanStyle,
} from './layout/style'

// --- レンダラー ---
export { SvgRenderer } from './renderer/svg'
export { svgToPng } from './renderer/png'

// --- 画像解決 ---
export { fetchAsDataUri, resolveImages, clearImageCache } from './image-resolver'
