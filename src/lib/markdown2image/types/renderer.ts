import type { LayoutBox } from './layout'

/** レンダラーの共通インターフェース */
export interface Renderer {
  render(layout: LayoutBox): string | Promise<string>
}

/**
 * コードハイライターの抽象インターフェース
 *
 * shiki のバージョンに依存せずハイライト機能を注入できる。
 * shiki v0.x (CJS) でも v1+ (ESM) でも、このインターフェースに適合するラッパーを渡せばよい。
 *
 * @example
 * // shiki v1+ (ESM) の場合
 * import { createHighlighter } from 'shiki'
 * const hl = await createHighlighter({ themes: ['github-light'], langs: ['typescript'] })
 * const adapter: CodeHighlighter = {
 *   getLoadedLanguages: () => hl.getLoadedLanguages(),
 *   tokenize: (code, lang, theme) => hl.codeToTokensBase(code, { lang, theme }),
 * }
 *
 * // shiki v0.x (CJS) の場合
 * const shiki = require('shiki')
 * const hl = await shiki.getHighlighter({ theme: 'github-light' })
 * const adapter: CodeHighlighter = {
 *   getLoadedLanguages: () => hl.getLoadedLanguages(),
 *   tokenize: (code, lang, _theme) => hl.codeToThemedTokens(code, lang),
 * }
 */
export interface CodeHighlighter {
  /** ロード済みの言語一覧を返す */
  getLoadedLanguages(): string[]

  /**
   * コードをトークナイズし、行ごとのトークン配列を返す
   *
   * 各トークンは { content, color?, fontStyle? } を持つ。
   * fontStyle は shiki の規約に準拠: 1 = bold, 2 = italic
   */
  tokenize(
    code: string,
    lang: string,
    theme: string,
  ): Array<Array<{ content: string; color?: string; fontStyle?: number }>>
}
