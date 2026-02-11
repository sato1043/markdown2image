import type { Theme } from '../../types/theme'

/** GitHub Dark テーマ */
export const GITHUB_DARK: Theme = {
  document: {
    width: 800,
    padding: { top: 40, right: 40, bottom: 40, left: 40 },
    backgroundColor: '#0d1117',
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
    text: '#e6edf3',
    link: '#58a6ff',
    muted: '#8b949e',
    border: '#30363d',
    codeBg: '#161b22',
    tableHeaderBg: '#161b22',
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
  syntaxTheme: 'github-dark',
}
