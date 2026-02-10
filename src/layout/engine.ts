import type { Root, RootContent, PhrasingContent } from 'mdast'
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

  constructor() {
    this.measurer = new TextMeasurer()
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
    const codeSpanStyle: SpanStyle = {
      ...defaultSpanStyle(),
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      code: true,
    }

    const codeLines = node.value.split('\n')
    const lineH = this.measurer.lineHeight(codeSpanStyle, style.lineHeight)
    const textHeight = codeLines.length * lineH
    const totalHeight = textHeight + style.padding.top + style.padding.bottom

    const lines = codeLines.map(line => ({
      spans: [{ text: line, style: codeSpanStyle }],
      width: this.measurer.measureWidth(line, codeSpanStyle),
      height: lineH,
    }))

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
