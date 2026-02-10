import type { Root, RootContent, PhrasingContent } from 'mdast'
import type { HighlighterGeneric, BundledLanguage, BundledTheme } from 'shiki'
import type { LayoutBox, TextSpan, SpanStyle, HeadingDepth } from '../types/layout'
import { TextMeasurer } from './measure'
import {
  documentStyle,
  headingStyle,
  paragraphStyle,
  codeBlockStyle,
  blockquoteStyle,
  listStyle,
  listItemStyle,
  hrStyle,
  defaultSpanStyle,
  inlineCodeSpanStyle,
  linkSpanStyle,
  DOCUMENT_PADDING,
  CONTENT_WIDTH,
  DOCUMENT_WIDTH,
} from './style'

/** mdast AST → LayoutBoxツリーを生成する */
export class LayoutEngine {
  private readonly measurer: TextMeasurer
  private highlighter: HighlighterGeneric<BundledLanguage, BundledTheme> | null = null

  constructor() {
    this.measurer = new TextMeasurer()
  }

  /** shiki Highlighterを設定する */
  setHighlighter(highlighter: HighlighterGeneric<BundledLanguage, BundledTheme>): void {
    this.highlighter = highlighter
  }

  /** ルートノードからレイアウトツリーを生成する */
  layout(root: Root): LayoutBox {
    const docStyle = documentStyle()
    const docBox: LayoutBox = {
      type: 'document',
      x: 0,
      y: 0,
      width: DOCUMENT_WIDTH,
      height: 0,
      style: docStyle,
      children: [],
    }

    let cursorY = DOCUMENT_PADDING.top

    for (const node of root.children) {
      const child = this.layoutBlock(node, DOCUMENT_PADDING.left, cursorY, CONTENT_WIDTH)
      if (child) {
        docBox.children.push(child)
        cursorY = child.y + child.height + child.style.margin.bottom
      }
    }

    docBox.height = cursorY + DOCUMENT_PADDING.bottom

    return docBox
  }

  /** ブロック要素をレイアウトする */
  private layoutBlock(
    node: RootContent,
    x: number,
    y: number,
    availableWidth: number,
  ): LayoutBox | null {
    switch (node.type) {
      case 'heading':
        return this.layoutHeading(node, x, y, availableWidth)
      case 'paragraph':
        return this.layoutParagraph(node, x, y, availableWidth)
      case 'code':
        return this.layoutCodeBlock(node, x, y, availableWidth)
      case 'blockquote':
        return this.layoutBlockquote(node, x, y, availableWidth)
      case 'list':
        return this.layoutList(node, x, y, availableWidth)
      case 'thematicBreak':
        return this.layoutHr(x, y, availableWidth)
      default:
        return null
    }
  }

  /** 見出しをレイアウトする */
  private layoutHeading(
    node: { type: 'heading'; depth: 1 | 2 | 3 | 4 | 5 | 6; children: PhrasingContent[] },
    x: number,
    y: number,
    availableWidth: number,
  ): LayoutBox {
    const depth = node.depth as HeadingDepth
    const style = headingStyle(depth)
    const baseSpanStyle: SpanStyle = {
      ...defaultSpanStyle(),
      bold: true,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
    }

    const spans = this.extractSpans(node.children, baseSpanStyle)
    const lines = this.measurer.wrapSpans(spans, availableWidth, style.lineHeight)
    const textHeight = lines.reduce((sum, line) => sum + line.height, 0)

    return {
      type: 'heading',
      x,
      y: y + style.margin.top,
      width: availableWidth,
      height: textHeight,
      style,
      children: [],
      lines,
      depth,
    }
  }

  /** 段落をレイアウトする */
  private layoutParagraph(
    node: { type: 'paragraph'; children: PhrasingContent[] },
    x: number,
    y: number,
    availableWidth: number,
  ): LayoutBox {
    const style = paragraphStyle()
    const baseSpanStyle = defaultSpanStyle()
    const spans = this.extractSpans(node.children, baseSpanStyle)
    const lines = this.measurer.wrapSpans(spans, availableWidth, style.lineHeight)
    const textHeight = lines.reduce((sum, line) => sum + line.height, 0)

    return {
      type: 'paragraph',
      x,
      y: y + style.margin.top,
      width: availableWidth,
      height: textHeight,
      style,
      children: [],
      lines,
    }
  }

  /** コードブロックをレイアウトする */
  private layoutCodeBlock(
    node: { type: 'code'; lang?: string | null; value: string },
    x: number,
    y: number,
    availableWidth: number,
  ): LayoutBox {
    const style = codeBlockStyle()
    const baseCodeStyle: SpanStyle = {
      ...defaultSpanStyle(),
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      code: true,
    }

    const lineH = this.measurer.lineHeight(baseCodeStyle, style.lineHeight)
    const lines = this.tokenizeCode(node.value, node.lang ?? null, baseCodeStyle, lineH)
    const textHeight = lines.length * lineH
    const totalHeight = textHeight + style.padding.top + style.padding.bottom

    return {
      type: 'code-block',
      x,
      y: y + style.margin.top,
      width: availableWidth,
      height: totalHeight,
      style,
      children: [],
      lines,
      language: node.lang ?? undefined,
      code: node.value,
    }
  }

  /** コードをトークナイズしてTextLine配列を返す */
  private tokenizeCode(
    code: string,
    lang: string | null,
    baseStyle: SpanStyle,
    lineH: number,
  ): { spans: TextSpan[]; width: number; height: number }[] {
    // shikiが利用可能で言語が指定されている場合はハイライトする
    if (this.highlighter && lang) {
      try {
        const loadedLangs = this.highlighter.getLoadedLanguages()
        if (loadedLangs.includes(lang)) {
          const tokenLines = this.highlighter.codeToTokensBase(code, {
            lang: lang as BundledLanguage,
            theme: 'github-light',
          })
          return tokenLines.map(tokenLine => {
            const spans: TextSpan[] = tokenLine.map(token => {
              const span: TextSpan = {
                text: token.content,
                style: {
                  ...baseStyle,
                  color: token.color ?? baseStyle.color,
                  bold: token.fontStyle === 1 || baseStyle.bold,
                  italic: token.fontStyle === 2 || baseStyle.italic,
                },
              }
              span.width = this.measurer.measureWidth(span.text, span.style)
              return span
            })
            const width = spans.reduce((sum, s) => sum + (s.width ?? 0), 0)
            return { spans, width, height: lineH }
          })
        }
      } catch {
        // ハイライト失敗時はフォールバックする
      }
    }

    // フォールバック: 単色表示
    const codeLines = code.split('\n')
    return codeLines.map(line => {
      const span: TextSpan = { text: line, style: baseStyle }
      span.width = this.measurer.measureWidth(line, baseStyle)
      return {
        spans: [span],
        width: span.width ?? 0,
        height: lineH,
      }
    })
  }

  /** 引用ブロックをレイアウトする */
  private layoutBlockquote(
    node: { type: 'blockquote'; children: RootContent[] },
    x: number,
    y: number,
    availableWidth: number,
  ): LayoutBox {
    const style = blockquoteStyle()
    const innerX = x + style.padding.left
    const innerWidth = availableWidth - style.padding.left - style.padding.right
    const children: LayoutBox[] = []
    let cursorY = y + style.margin.top

    for (const child of node.children) {
      const laid = this.layoutBlock(child as RootContent, innerX, cursorY, innerWidth)
      if (laid) {
        children.push(laid)
        cursorY = laid.y + laid.height + laid.style.margin.bottom
      }
    }

    const totalHeight = cursorY - (y + style.margin.top)

    return {
      type: 'blockquote',
      x,
      y: y + style.margin.top,
      width: availableWidth,
      height: totalHeight,
      style,
      children,
    }
  }

  /** リストをレイアウトする */
  private layoutList(
    node: { type: 'list'; ordered?: boolean | null; start?: number | null; children: Array<{ type: 'listItem'; children: RootContent[]; checked?: boolean | null }> },
    x: number,
    y: number,
    availableWidth: number,
  ): LayoutBox {
    const style = listStyle()
    const innerX = x + style.padding.left
    const innerWidth = availableWidth - style.padding.left - style.padding.right
    const children: LayoutBox[] = []
    let cursorY = y + style.margin.top

    node.children.forEach((item, index) => {
      const marker = this.listMarker(node.ordered ?? false, (node.start ?? 1) + index, item.checked)
      const itemBox = this.layoutListItem(item, innerX, cursorY, innerWidth, marker)
      children.push(itemBox)
      cursorY = itemBox.y + itemBox.height + itemBox.style.margin.bottom
    })

    const totalHeight = cursorY - (y + style.margin.top)

    return {
      type: 'list',
      x,
      y: y + style.margin.top,
      width: availableWidth,
      height: totalHeight,
      style,
      children,
    }
  }

  /** リストアイテムをレイアウトする */
  private layoutListItem(
    node: { type: 'listItem'; children: RootContent[]; checked?: boolean | null },
    x: number,
    y: number,
    availableWidth: number,
    marker: string,
  ): LayoutBox {
    const style = listItemStyle()
    const children: LayoutBox[] = []
    let cursorY = y

    for (const child of node.children) {
      const laid = this.layoutBlock(child as RootContent, x, cursorY, availableWidth)
      if (laid) {
        children.push(laid)
        cursorY = laid.y + laid.height + laid.style.margin.bottom
      }
    }

    const totalHeight = cursorY - y

    return {
      type: 'list-item',
      x,
      y,
      width: availableWidth,
      height: totalHeight,
      style,
      children,
      marker,
    }
  }

  /** リストマーカーの文字列を返す */
  private listMarker(ordered: boolean, index: number, checked?: boolean | null): string {
    if (checked === true) return '\u2611 '
    if (checked === false) return '\u2610 '
    if (ordered) return `${index}. `
    return '\u2022 '
  }

  /** 水平線をレイアウトする */
  private layoutHr(x: number, y: number, availableWidth: number): LayoutBox {
    const style = hrStyle()
    return {
      type: 'hr',
      x,
      y: y + style.margin.top,
      width: availableWidth,
      height: 2,
      style,
      children: [],
    }
  }

  /** PhrasingContent配列からTextSpan配列を抽出する */
  private extractSpans(nodes: PhrasingContent[], baseStyle: SpanStyle): TextSpan[] {
    const spans: TextSpan[] = []

    for (const node of nodes) {
      switch (node.type) {
        case 'text':
          spans.push({ text: node.value, style: baseStyle })
          break
        case 'strong':
          spans.push(
            ...this.extractSpans(node.children, { ...baseStyle, bold: true }),
          )
          break
        case 'emphasis':
          spans.push(
            ...this.extractSpans(node.children, { ...baseStyle, italic: true }),
          )
          break
        case 'inlineCode':
          spans.push({
            text: node.value,
            style: { ...baseStyle, ...inlineCodeSpanStyle() },
          })
          break
        case 'link':
          spans.push(
            ...this.extractSpans(node.children, {
              ...baseStyle,
              ...linkSpanStyle(),
              link: node.url,
            }),
          )
          break
        case 'delete':
          spans.push(
            ...this.extractSpans(node.children, { ...baseStyle, strikethrough: true }),
          )
          break
        default:
          // 未対応のインライン要素はスキップする
          break
      }
    }

    return spans
  }
}
