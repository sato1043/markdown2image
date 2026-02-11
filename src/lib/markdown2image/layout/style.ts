import type { BoxStyle, SpanStyle, Spacing, HeadingDepth } from '../types/layout'
import type { Theme } from '../types/theme'
import { GITHUB_LIGHT } from '../theme/presets/github-light'

const ZERO_SPACING: Spacing = { top: 0, right: 0, bottom: 0, left: 0 }

/** スタイルファクトリが提供する関数群 */
export type StyleFactory = {
  readonly theme: Theme
  documentWidth(): number
  documentPadding(): Spacing
  contentWidth(): number
  tableCellPadH(): number
  documentStyle(): BoxStyle
  headingStyle(depth: HeadingDepth): BoxStyle
  paragraphStyle(): BoxStyle
  codeBlockStyle(): BoxStyle
  blockquoteStyle(): BoxStyle
  listStyle(): BoxStyle
  listItemStyle(): BoxStyle
  hrStyle(): BoxStyle
  tableStyle(): BoxStyle
  tableCellStyle(isHeader: boolean): BoxStyle
  imageStyle(): BoxStyle
  footnoteBlockStyle(): BoxStyle
  defaultSpanStyle(): SpanStyle
  inlineCodeSpanStyle(): Partial<SpanStyle>
  linkSpanStyle(): Partial<SpanStyle>
}

/** テーマからスタイルファクトリを生成する */
export function createStyleFactory(theme: Theme): StyleFactory {
  const t = theme

  return {
    theme: t,

    documentWidth: () => t.document.width,
    documentPadding: () => t.document.padding,
    contentWidth: () => t.document.width - t.document.padding.left - t.document.padding.right,
    tableCellPadH: () => t.spacing.tableCellPadding.left + t.spacing.tableCellPadding.right,

    documentStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.text,
      backgroundColor: t.document.backgroundColor,
      padding: t.document.padding,
      margin: ZERO_SPACING,
    }),

    headingStyle: (depth: HeadingDepth): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.heading.sizes[depth],
      lineHeight: t.heading.lineHeight,
      color: t.color.text,
      padding: ZERO_SPACING,
      margin: t.heading.margins[depth],
    }),

    paragraphStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.text,
      padding: ZERO_SPACING,
      margin: { top: 0, right: 0, bottom: t.spacing.blockMarginBottom, left: 0 },
    }),

    codeBlockStyle: (): BoxStyle => ({
      fontFamily: t.font.code.family,
      fontSize: t.font.code.size,
      lineHeight: t.font.code.lineHeight,
      color: t.color.text,
      backgroundColor: t.color.codeBg,
      borderColor: t.color.border,
      padding: t.spacing.codeBlockPadding,
      margin: { top: 0, right: 0, bottom: t.spacing.blockMarginBottom, left: 0 },
    }),

    blockquoteStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.muted,
      borderColor: t.color.border,
      padding: { top: 0, right: 0, bottom: 0, left: t.spacing.blockquotePaddingLeft },
      margin: { top: 0, right: 0, bottom: t.spacing.blockMarginBottom, left: 0 },
    }),

    listStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.text,
      padding: { top: 0, right: 0, bottom: 0, left: t.spacing.listPaddingLeft },
      margin: { top: 0, right: 0, bottom: t.spacing.blockMarginBottom, left: 0 },
    }),

    listItemStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.text,
      padding: ZERO_SPACING,
      margin: { top: 0, right: 0, bottom: t.spacing.listItemMarginBottom, left: 0 },
    }),

    hrStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.border,
      padding: ZERO_SPACING,
      margin: { top: t.spacing.hrMarginVertical, right: 0, bottom: t.spacing.hrMarginVertical, left: 0 },
    }),

    tableStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.text,
      borderColor: t.color.border,
      padding: ZERO_SPACING,
      margin: { top: 0, right: 0, bottom: t.spacing.blockMarginBottom, left: 0 },
    }),

    tableCellStyle: (isHeader: boolean): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.text,
      backgroundColor: isHeader ? t.color.tableHeaderBg : undefined,
      borderColor: t.color.border,
      padding: t.spacing.tableCellPadding,
      margin: ZERO_SPACING,
    }),

    imageStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
      lineHeight: t.font.base.lineHeight,
      color: t.color.text,
      borderColor: t.color.border,
      padding: ZERO_SPACING,
      margin: { top: 0, right: 0, bottom: t.spacing.blockMarginBottom, left: 0 },
    }),

    footnoteBlockStyle: (): BoxStyle => ({
      fontFamily: t.font.base.family,
      fontSize: t.footnote.fontSize,
      lineHeight: t.footnote.lineHeight,
      color: t.color.muted,
      borderColor: t.color.border,
      padding: { top: t.spacing.footnotePaddingTop, right: 0, bottom: 0, left: 0 },
      margin: { top: t.spacing.footnoteMarginTop, right: 0, bottom: 0, left: 0 },
    }),

    defaultSpanStyle: (): SpanStyle => ({
      bold: false,
      italic: false,
      code: false,
      strikethrough: false,
      color: t.color.text,
      fontFamily: t.font.base.family,
      fontSize: t.font.base.size,
    }),

    inlineCodeSpanStyle: (): Partial<SpanStyle> => ({
      code: true,
      fontFamily: t.font.code.family,
      fontSize: t.font.code.size,
    }),

    linkSpanStyle: (): Partial<SpanStyle> => ({
      color: t.color.link,
    }),
  }
}

// --- デフォルトファクトリ（後方互換性のための既存エクスポート） ---

const defaultFactory = createStyleFactory(GITHUB_LIGHT)

/** ドキュメント全体の幅 (px) */
export const DOCUMENT_WIDTH = defaultFactory.documentWidth()

/** ドキュメントのパディング */
export const DOCUMENT_PADDING: Spacing = defaultFactory.documentPadding()

/** コンテンツ領域の幅 */
export const CONTENT_WIDTH = defaultFactory.contentWidth()

/** テーブルセルのパディング水平合計 */
export const TABLE_CELL_PAD_H = defaultFactory.tableCellPadH()

/** ドキュメントのスタイル */
export const documentStyle = defaultFactory.documentStyle.bind(defaultFactory)

/** 見出しのスタイル */
export const headingStyle = defaultFactory.headingStyle.bind(defaultFactory)

/** 段落のスタイル */
export const paragraphStyle = defaultFactory.paragraphStyle.bind(defaultFactory)

/** コードブロックのスタイル */
export const codeBlockStyle = defaultFactory.codeBlockStyle.bind(defaultFactory)

/** 引用ブロックのスタイル */
export const blockquoteStyle = defaultFactory.blockquoteStyle.bind(defaultFactory)

/** リストのスタイル */
export const listStyle = defaultFactory.listStyle.bind(defaultFactory)

/** リストアイテムのスタイル */
export const listItemStyle = defaultFactory.listItemStyle.bind(defaultFactory)

/** 水平線のスタイル */
export const hrStyle = defaultFactory.hrStyle.bind(defaultFactory)

/** デフォルトのインラインスタイル */
export const defaultSpanStyle = defaultFactory.defaultSpanStyle.bind(defaultFactory)

/** インラインコードのスタイル */
export const inlineCodeSpanStyle = defaultFactory.inlineCodeSpanStyle.bind(defaultFactory)

/** リンクのスタイル */
export const linkSpanStyle = defaultFactory.linkSpanStyle.bind(defaultFactory)

/** テーブルのスタイル */
export const tableStyle = defaultFactory.tableStyle.bind(defaultFactory)

/** テーブルセルのスタイル */
export const tableCellStyle = defaultFactory.tableCellStyle.bind(defaultFactory)

/** 画像のスタイル */
export const imageStyle = defaultFactory.imageStyle.bind(defaultFactory)

/** 脚注ブロックのスタイル */
export const footnoteBlockStyle = defaultFactory.footnoteBlockStyle.bind(defaultFactory)
