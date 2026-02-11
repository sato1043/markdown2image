import type { Theme } from '../../types/theme'

/** GitHub Light テーマ — 現在の style.ts のデフォルト値と同一 */
export const GITHUB_LIGHT: Theme = {
  document: {
    width: 800,
    padding: { top: 40, right: 40, bottom: 40, left: 40 },
    backgroundColor: '#ffffff',
  },
  font: {
    base: {
      family: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
      size: 16,
      lineHeight: 1.6,
    },
    code: {
      family: '"Source Code Pro", "Consolas", "Menlo", monospace',
      size: 14,
      lineHeight: 1.5,
    },
  },
  color: {
    text: '#1a1a1a',
    link: '#0969da',
    muted: '#656d76',
    border: '#d0d7de',
    codeBg: '#f6f8fa',
    tableHeaderBg: '#f6f8fa',
  },
  heading: {
    sizes: { 1: 32, 2: 24, 3: 20, 4: 18, 5: 16, 6: 14 },
    lineHeight: 1.3,
    margins: {
      1: { top: 24, right: 0, bottom: 16, left: 0 },
      2: { top: 24, right: 0, bottom: 16, left: 0 },
      3: { top: 20, right: 0, bottom: 12, left: 0 },
      4: { top: 16, right: 0, bottom: 8, left: 0 },
      5: { top: 16, right: 0, bottom: 8, left: 0 },
      6: { top: 16, right: 0, bottom: 8, left: 0 },
    },
  },
  spacing: {
    blockMarginBottom: 16,
    codeBlockPadding: { top: 16, right: 16, bottom: 16, left: 16 },
    blockquotePaddingLeft: 16,
    listPaddingLeft: 24,
    listItemMarginBottom: 4,
    hrMarginVertical: 24,
    tableCellPadding: { top: 6, right: 12, bottom: 6, left: 12 },
    footnoteMarginTop: 24,
    footnotePaddingTop: 16,
    footnoteItemMarginBottom: 4,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 1.5,
    referenceScale: 0.75,
  },
  imagePlaceholderHeight: 200,
  syntaxTheme: 'github-light',
}
