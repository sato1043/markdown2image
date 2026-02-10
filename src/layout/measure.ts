import type { SpanStyle, TextSpan, TextLine } from '../types/layout'

/** オフスクリーンCanvasによるテキスト計測 */
export class TextMeasurer {
  private readonly ctx: CanvasRenderingContext2D

  constructor() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 2D context is not available')
    }
    this.ctx = ctx
  }

  /** SpanStyleからCanvas fontプロパティの文字列を構築する */
  private buildFont(style: SpanStyle): string {
    const weight = style.bold ? 'bold' : 'normal'
    const fontStyle = style.italic ? 'italic' : 'normal'
    return `${fontStyle} ${weight} ${style.fontSize}px ${style.fontFamily}`
  }

  /** テキストの幅を計測する */
  measureWidth(text: string, style: SpanStyle): number {
    this.ctx.font = this.buildFont(style)
    return this.ctx.measureText(text).width
  }

  /** フォントメトリクスからの行の高さを返す */
  lineHeight(style: SpanStyle, lineHeightRatio: number): number {
    return style.fontSize * lineHeightRatio
  }

  /**
   * TextSpan配列を指定幅で折り返し、TextLine配列を返す
   *
   * 入力: spans = [{text: "Hello world foo bar", style: ...}], maxWidth = 100
   * 出力: [{spans: [{text: "Hello world", ...}], width: 90, height: 25.6}, ...]
   */
  wrapSpans(spans: TextSpan[], maxWidth: number, lineHeightRatio: number): TextLine[] {
    if (spans.length === 0) {
      return []
    }

    const lines: TextLine[] = []
    let currentLineSpans: TextSpan[] = []
    let currentLineWidth = 0
    let currentLineHeight = 0

    for (const span of spans) {
      const lh = this.lineHeight(span.style, lineHeightRatio)
      if (lh > currentLineHeight) {
        currentLineHeight = lh
      }

      const words = this.splitToSegments(span.text)

      for (const word of words) {
        const wordWidth = this.measureWidth(word, span.style)

        // 現在の行に収まらない場合は改行する
        if (currentLineSpans.length > 0 && currentLineWidth + wordWidth > maxWidth) {
          lines.push({
            spans: trimLineSpans(currentLineSpans),
            width: currentLineWidth,
            height: currentLineHeight,
          })
          currentLineSpans = []
          currentLineWidth = 0
          currentLineHeight = lh
        }

        // 単語を現在の行に追加する
        const lastSpan = currentLineSpans[currentLineSpans.length - 1]
        if (lastSpan && lastSpan.style === span.style) {
          lastSpan.text += word
        } else {
          currentLineSpans.push({ text: word, style: span.style })
        }
        currentLineWidth += wordWidth
      }
    }

    // 最後の行を追加する
    if (currentLineSpans.length > 0) {
      lines.push({
        spans: trimLineSpans(currentLineSpans),
        width: currentLineWidth,
        height: currentLineHeight,
      })
    }

    return lines
  }

  /**
   * テキストを折り返し可能な単位に分割する
   * 英語: 空白区切り（空白を含む）
   * 日本語: 1文字ずつ
   */
  private splitToSegments(text: string): string[] {
    const segments: string[] = []
    let current = ''

    for (const char of text) {
      if (isCJK(char)) {
        // CJKの前に溜まった非CJK文字列を出力する
        if (current.length > 0) {
          segments.push(current)
          current = ''
        }
        segments.push(char)
      } else if (char === ' ' || char === '\t') {
        current += char
        segments.push(current)
        current = ''
      } else {
        current += char
      }
    }

    if (current.length > 0) {
      segments.push(current)
    }

    return segments
  }
}

/** CJK文字かどうかを判定する */
function isCJK(char: string): boolean {
  const code = char.codePointAt(0)
  if (code === undefined) return false
  // CJK Unified Ideographs, Hiragana, Katakana, Hangul
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||  // CJK Unified Ideographs
    (code >= 0x3040 && code <= 0x309f) ||  // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) ||  // Katakana
    (code >= 0x3400 && code <= 0x4dbf) ||  // CJK Extension A
    (code >= 0xac00 && code <= 0xd7af) ||  // Hangul Syllables
    (code >= 0xff00 && code <= 0xffef) ||  // Fullwidth Forms
    (code >= 0x3000 && code <= 0x303f)     // CJK Symbols and Punctuation
  )
}

/** 行の先頭・末尾の空白を除去する */
function trimLineSpans(spans: TextSpan[]): TextSpan[] {
  if (spans.length === 0) return spans

  // 先頭の空白を除去する
  const first = spans[0]
  spans[0] = { ...first, text: first.text.replace(/^[\s\t]+/, '') }

  // 末尾の空白を除去する
  const last = spans[spans.length - 1]
  spans[spans.length - 1] = { ...last, text: last.text.replace(/[\s\t]+$/, '') }

  return spans.filter(s => s.text.length > 0)
}
