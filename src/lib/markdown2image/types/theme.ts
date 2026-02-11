import type { Spacing, HeadingDepth } from './layout'

/** オブジェクトの全プロパティを再帰的にオプショナルにする */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** テーマの完全な型定義 */
export type Theme = {
  document: {
    width: number
    padding: Spacing
    backgroundColor: string
  }
  font: {
    base: { family: string; size: number; lineHeight: number }
    code: { family: string; size: number; lineHeight: number }
  }
  color: {
    text: string
    link: string
    muted: string
    border: string
    codeBg: string
    tableHeaderBg: string
  }
  heading: {
    sizes: Record<HeadingDepth, number>
    lineHeight: number
    margins: Record<HeadingDepth, Spacing>
  }
  spacing: {
    blockMarginBottom: number
    codeBlockPadding: Spacing
    blockquotePaddingLeft: number
    listPaddingLeft: number
    listItemMarginBottom: number
    hrMarginVertical: number
    tableCellPadding: Spacing
    footnoteMarginTop: number
    footnotePaddingTop: number
    footnoteItemMarginBottom: number
  }
  footnote: {
    fontSize: number
    lineHeight: number
    referenceScale: number
  }
  imagePlaceholderHeight: number
  syntaxTheme: string
}

/** 利用可能なプリセット名 */
export type ThemePreset = 'github-light' | 'github-dark'

/** テーマ設定（プリセット名 or 部分上書き付きオブジェクト） */
export type ThemeConfig = DeepPartial<Theme> & { base?: ThemePreset }
