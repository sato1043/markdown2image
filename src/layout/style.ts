import type { BoxStyle, SpanStyle, Spacing, HeadingDepth } from '../types/layout'

const ZERO_SPACING: Spacing = { top: 0, right: 0, bottom: 0, left: 0 }

const BASE_FONT_FAMILY = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
const CODE_FONT_FAMILY = '"Source Code Pro", "Consolas", "Menlo", monospace'
const BASE_FONT_SIZE = 16
const BASE_LINE_HEIGHT = 1.6
const BASE_COLOR = '#1a1a1a'
const LINK_COLOR = '#0969da'
const CODE_BG_COLOR = '#f6f8fa'
const CODE_BORDER_COLOR = '#d0d7de'
const BLOCKQUOTE_BORDER_COLOR = '#d0d7de'
const BLOCKQUOTE_COLOR = '#656d76'
const HR_COLOR = '#d0d7de'

/** ドキュメント全体の幅 (px) */
export const DOCUMENT_WIDTH = 800

/** ドキュメントのパディング */
export const DOCUMENT_PADDING: Spacing = { top: 40, right: 40, bottom: 40, left: 40 }

/** コンテンツ領域の幅 */
export const CONTENT_WIDTH = DOCUMENT_WIDTH - DOCUMENT_PADDING.left - DOCUMENT_PADDING.right

const HEADING_FONT_SIZES: Record<HeadingDepth, number> = {
  1: 32,
  2: 24,
  3: 20,
  4: 18,
  5: 16,
  6: 14,
}

const HEADING_MARGINS: Record<HeadingDepth, Spacing> = {
  1: { top: 24, right: 0, bottom: 16, left: 0 },
  2: { top: 24, right: 0, bottom: 16, left: 0 },
  3: { top: 20, right: 0, bottom: 12, left: 0 },
  4: { top: 16, right: 0, bottom: 8, left: 0 },
  5: { top: 16, right: 0, bottom: 8, left: 0 },
  6: { top: 16, right: 0, bottom: 8, left: 0 },
}

/** ドキュメントのスタイル */
export function documentStyle(): BoxStyle {
  return {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: BASE_FONT_SIZE,
    lineHeight: BASE_LINE_HEIGHT,
    color: BASE_COLOR,
    backgroundColor: '#ffffff',
    padding: DOCUMENT_PADDING,
    margin: ZERO_SPACING,
  }
}

/** 見出しのスタイル */
export function headingStyle(depth: HeadingDepth): BoxStyle {
  return {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: HEADING_FONT_SIZES[depth],
    lineHeight: 1.3,
    color: BASE_COLOR,
    padding: ZERO_SPACING,
    margin: HEADING_MARGINS[depth],
  }
}

/** 段落のスタイル */
export function paragraphStyle(): BoxStyle {
  return {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: BASE_FONT_SIZE,
    lineHeight: BASE_LINE_HEIGHT,
    color: BASE_COLOR,
    padding: ZERO_SPACING,
    margin: { top: 0, right: 0, bottom: 16, left: 0 },
  }
}

/** コードブロックのスタイル */
export function codeBlockStyle(): BoxStyle {
  return {
    fontFamily: CODE_FONT_FAMILY,
    fontSize: 14,
    lineHeight: 1.5,
    color: BASE_COLOR,
    backgroundColor: CODE_BG_COLOR,
    borderColor: CODE_BORDER_COLOR,
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    margin: { top: 0, right: 0, bottom: 16, left: 0 },
  }
}

/** 引用ブロックのスタイル */
export function blockquoteStyle(): BoxStyle {
  return {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: BASE_FONT_SIZE,
    lineHeight: BASE_LINE_HEIGHT,
    color: BLOCKQUOTE_COLOR,
    borderColor: BLOCKQUOTE_BORDER_COLOR,
    padding: { top: 0, right: 0, bottom: 0, left: 16 },
    margin: { top: 0, right: 0, bottom: 16, left: 0 },
  }
}

/** リストのスタイル */
export function listStyle(): BoxStyle {
  return {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: BASE_FONT_SIZE,
    lineHeight: BASE_LINE_HEIGHT,
    color: BASE_COLOR,
    padding: { top: 0, right: 0, bottom: 0, left: 24 },
    margin: { top: 0, right: 0, bottom: 16, left: 0 },
  }
}

/** リストアイテムのスタイル */
export function listItemStyle(): BoxStyle {
  return {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: BASE_FONT_SIZE,
    lineHeight: BASE_LINE_HEIGHT,
    color: BASE_COLOR,
    padding: ZERO_SPACING,
    margin: { top: 0, right: 0, bottom: 4, left: 0 },
  }
}

/** 水平線のスタイル */
export function hrStyle(): BoxStyle {
  return {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: BASE_FONT_SIZE,
    lineHeight: BASE_LINE_HEIGHT,
    color: HR_COLOR,
    padding: ZERO_SPACING,
    margin: { top: 24, right: 0, bottom: 24, left: 0 },
  }
}

/** デフォルトのインラインスタイル */
export function defaultSpanStyle(): SpanStyle {
  return {
    bold: false,
    italic: false,
    code: false,
    strikethrough: false,
    color: BASE_COLOR,
    fontFamily: BASE_FONT_FAMILY,
    fontSize: BASE_FONT_SIZE,
  }
}

/** インラインコードのスタイル */
export function inlineCodeSpanStyle(): Partial<SpanStyle> {
  return {
    code: true,
    fontFamily: CODE_FONT_FAMILY,
    fontSize: 14,
  }
}

/** リンクのスタイル */
export function linkSpanStyle(): Partial<SpanStyle> {
  return {
    color: LINK_COLOR,
  }
}
