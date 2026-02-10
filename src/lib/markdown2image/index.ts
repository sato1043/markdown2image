/**
 * markdown2image — Markdown を SVG / PNG 画像に変換するライブラリ
 *
 * このディレクトリを別の TypeScript プロジェクトにコピーして利用できる。
 *
 * ## 必要な依存パッケージ
 *
 * ```bash
 * npm install unified remark-parse remark-gfm shiki
 * npm install --save-dev @types/mdast
 * ```
 *
 * ## tsconfig.json に必要な設定
 *
 * - "target": "ES2022" 以上
 * - "module": "ESNext" または "ES2022"
 * - "moduleResolution": "bundler" または "node16"
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
 * import { createHighlighter } from 'shiki'
 *
 * // 1. Markdown → AST
 * const ast = parseMarkdown('# Hello\n\nworld')
 *
 * // 2. AST → LayoutBox（オプション: shiki ハイライタを設定）
 * const engine = new LayoutEngine()
 * // const hl = await createHighlighter({ themes: ['github-light'], langs: ['typescript'] })
 * // engine.setHighlighter(hl)
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

export type { Renderer } from './types/renderer'

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
