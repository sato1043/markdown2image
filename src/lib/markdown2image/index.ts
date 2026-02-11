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
 * - "strict": true 推奨
 * - "esModuleInterop": true — unified 等 CJS パッケージの default import に必要
 * - "isolatedModules": true — Vite 等のバンドラーを使う場合に必要
 *
 * ### skipLibCheck について
 *
 * "skipLibCheck": true は使用しない。
 * shiki 等の依存パッケージの型定義（.d.mts）も含めて型チェックを行う。
 * WebStorm は shiki の BundledHighlighterOptions 内の StringLiteralUnion<T> 型を
 * 正しく解決できない既知の問題があるため、呼び出し側で
 * `// noinspection TypeScriptValidateTypes` による抑制が必要な場合がある。
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
 * import { markdownToSvg, markdownToPng } from './lib/markdown2image'
 *
 * // Markdown → SVG 文字列
 * const svg = await markdownToSvg('# Hello\n\nworld')
 *
 * // Markdown → PNG Blob
 * const png = await markdownToPng('# Hello\n\nworld')
 *
 * // シンタックスハイライト付き
 * const svg = await markdownToSvg(md, { highlighter })
 *
 * // テーマ指定（プリセット名）
 * const darkSvg = await markdownToSvg(md, { theme: 'github-dark' })
 *
 * // テーマ指定（部分上書き）
 * const customSvg = await markdownToSvg(md, {
 *   theme: { base: 'github-dark', color: { link: '#ff6600' } },
 * })
 * ```
 *
 * ## 上級: 個別クラスを直接使う
 *
 * パーサー・レイアウトエンジン・レンダラーを個別に制御する場合は
 * `parseMarkdown`, `LayoutEngine`, `SvgRenderer`, `resolveImages`, `svgToPng`
 * を直接インポートして使う。
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

export type { Theme, ThemePreset, ThemeConfig, DeepPartial } from './types/theme'

// --- テーマ ---
export { resolveTheme } from './theme/resolve'
export { GITHUB_LIGHT } from './theme/presets/github-light'
export { GITHUB_DARK } from './theme/presets/github-dark'

// --- パーサー ---
export { parseMarkdown } from './parser/markdown'

// --- レイアウト ---
export { LayoutEngine } from './layout/engine'
export { TextMeasurer } from './layout/measure'
export {
  createStyleFactory,
  type StyleFactory,
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

// --- 統合関数 ---

import { parseMarkdown } from './parser/markdown'
import { LayoutEngine } from './layout/engine'
import { SvgRenderer } from './renderer/svg'
import { svgToPng } from './renderer/png'
import { resolveImages } from './image-resolver'
import { resolveTheme } from './theme/resolve'
import type { CodeHighlighter } from './types/renderer'
import type { ThemePreset, ThemeConfig } from './types/theme'

/** 統合関数のオプション */
export type MarkdownToImageOptions = {
  highlighter?: CodeHighlighter
  theme?: ThemePreset | ThemeConfig
}

/** Markdown → SVG 文字列 */
export async function markdownToSvg(
  markdown: string,
  options?: MarkdownToImageOptions,
): Promise<string> {
  const theme = resolveTheme(options?.theme)
  const ast = parseMarkdown(markdown)
  const engine = new LayoutEngine(theme)
  if (options?.highlighter) {
    engine.setHighlighter(options.highlighter)
  }
  const layout = engine.layout(ast)
  await resolveImages(layout)
  const renderer = new SvgRenderer(theme)
  return renderer.render(layout)
}

/** Markdown → PNG Blob */
export async function markdownToPng(
  markdown: string,
  options?: MarkdownToImageOptions,
): Promise<Blob> {
  const svg = await markdownToSvg(markdown, options)
  return svgToPng(svg)
}
