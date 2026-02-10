import type { LayoutBox, TextLine, TextSpan, SpanStyle } from '../types/layout'
import type { Renderer } from '../types/renderer'

/** LayoutBoxツリーからSVG文字列を生成するレンダラー */
export class SvgRenderer implements Renderer {
  render(layout: LayoutBox): string {
    const children = this.renderBox(layout)
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">`,
      `  <rect width="${layout.width}" height="${layout.height}" fill="${layout.style.backgroundColor ?? '#ffffff'}" />`,
      children,
      '</svg>',
    ].join('\n')
  }

  /** LayoutBoxを再帰的にSVG要素に変換する */
  private renderBox(box: LayoutBox): string {
    switch (box.type) {
      case 'document':
        return box.children.map(child => this.renderBox(child)).join('\n')
      case 'heading':
        return this.renderTextBlock(box)
      case 'paragraph':
        return this.renderTextBlock(box)
      case 'code-block':
        return this.renderCodeBlock(box)
      case 'blockquote':
        return this.renderBlockquote(box)
      case 'list':
        return this.renderList(box)
      case 'list-item':
        return this.renderListItem(box)
      case 'hr':
        return this.renderHr(box)
      default:
        return ''
    }
  }

  /** テキストブロック（見出し・段落）をSVGに変換する */
  private renderTextBlock(box: LayoutBox): string {
    if (!box.lines || box.lines.length === 0) return ''

    const elements: string[] = []
    let lineY = box.y

    for (const line of box.lines) {
      elements.push(this.renderTextLine(line, box.x, lineY))
      lineY += line.height
    }

    return elements.join('\n')
  }

  /** 1行分のテキストをSVGに変換する */
  private renderTextLine(line: TextLine, x: number, y: number): string {
    if (line.spans.length === 0) return ''

    // ベースラインを行の高さの75%の位置とする (概算)
    const baselineY = y + line.height * 0.75
    const parts: string[] = []
    let cursorX = x

    for (const span of line.spans) {
      const attrs = this.spanAttributes(span.style)
      const escaped = escapeXml(span.text)

      if (span.style.strikethrough) {
        const width = this.estimateSpanWidth(span)
        parts.push(
          `<text x="${cursorX}" y="${baselineY}" ${attrs}>${escaped}</text>`,
        )
        // 取り消し線 (テキスト中央に線を引く)
        const strikeY = y + line.height * 0.55
        parts.push(
          `<line x1="${cursorX}" y1="${strikeY}" x2="${cursorX + width}" y2="${strikeY}" stroke="${span.style.color}" stroke-width="1" />`,
        )
        cursorX += width
      } else if (span.style.code) {
        // インラインコード: 背景付き
        const width = this.estimateSpanWidth(span)
        const bgPad = 3
        parts.push(
          `<rect x="${cursorX - bgPad}" y="${y + 2}" width="${width + bgPad * 2}" height="${line.height - 4}" rx="3" fill="#f6f8fa" stroke="#d0d7de" stroke-width="0.5" />`,
        )
        parts.push(
          `<text x="${cursorX}" y="${baselineY}" ${attrs}>${escaped}</text>`,
        )
        cursorX += width + bgPad * 2
      } else {
        parts.push(
          `<text x="${cursorX}" y="${baselineY}" ${attrs}>${escaped}</text>`,
        )
        // テキスト幅は次のspanのx位置に反映させる必要がある
        // SVGではtextLength等を使うのが理想だがPhase 1ではフォントサイズからの概算を使う
        cursorX += this.estimateSpanWidth(span)
      }
    }

    return parts.join('\n')
  }

  /** SpanStyleからSVGのtext属性文字列を構築する */
  private spanAttributes(style: SpanStyle): string {
    const attrs: string[] = []
    attrs.push(`fill="${style.color}"`)
    attrs.push(`font-family="${escapeXml(style.fontFamily)}"`)
    attrs.push(`font-size="${style.fontSize}"`)
    if (style.bold) attrs.push('font-weight="bold"')
    if (style.italic) attrs.push('font-style="italic"')
    return attrs.join(' ')
  }

  /** テキスト幅の概算 (実際のmeasureTextの結果は保持していないため概算する) */
  private estimateSpanWidth(span: TextSpan): number {
    // 日本語文字は fontSize とほぼ同じ幅、ASCII文字は fontSize * 0.6 と仮定する
    let width = 0
    for (const char of span.text) {
      const code = char.codePointAt(0) ?? 0
      if (code > 0x7f) {
        width += span.style.fontSize
      } else {
        width += span.style.fontSize * 0.6
      }
    }
    if (span.style.bold) width *= 1.05
    return width
  }

  /** コードブロックをSVGに変換する */
  private renderCodeBlock(box: LayoutBox): string {
    if (!box.lines) return ''

    const elements: string[] = []

    // 背景矩形
    elements.push(
      `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="6" fill="${box.style.backgroundColor ?? '#f6f8fa'}" stroke="${box.style.borderColor ?? '#d0d7de'}" stroke-width="1" />`,
    )

    // コード行
    let lineY = box.y + box.style.padding.top
    for (const line of box.lines) {
      if (line.spans.length > 0 && line.spans[0].text.length > 0) {
        const span = line.spans[0]
        const attrs = this.spanAttributes(span.style)
        const baselineY = lineY + line.height * 0.75
        elements.push(
          `<text x="${box.x + box.style.padding.left}" y="${baselineY}" ${attrs}>${escapeXml(span.text)}</text>`,
        )
      }
      lineY += line.height
    }

    return elements.join('\n')
  }

  /** 引用ブロックをSVGに変換する */
  private renderBlockquote(box: LayoutBox): string {
    const elements: string[] = []

    // 左ボーダー
    elements.push(
      `<line x1="${box.x + 2}" y1="${box.y}" x2="${box.x + 2}" y2="${box.y + box.height}" stroke="${box.style.borderColor ?? '#d0d7de'}" stroke-width="4" stroke-linecap="round" />`,
    )

    // 子要素
    for (const child of box.children) {
      elements.push(this.renderBox(child))
    }

    return elements.join('\n')
  }

  /** リストをSVGに変換する */
  private renderList(box: LayoutBox): string {
    return box.children.map(child => this.renderBox(child)).join('\n')
  }

  /** リストアイテムをSVGに変換する */
  private renderListItem(box: LayoutBox): string {
    const elements: string[] = []

    // マーカーを描画する
    if (box.marker && box.children.length > 0) {
      const firstChild = box.children[0]
      const markerStyle = { ...firstChild.style }
      const baselineY = firstChild.y + (firstChild.lines?.[0]?.height ?? markerStyle.fontSize * markerStyle.lineHeight) * 0.75
      elements.push(
        `<text x="${box.x - 20}" y="${baselineY}" fill="${markerStyle.color}" font-family="${escapeXml(markerStyle.fontFamily)}" font-size="${markerStyle.fontSize}">${escapeXml(box.marker)}</text>`,
      )
    }

    // 子要素
    for (const child of box.children) {
      elements.push(this.renderBox(child))
    }

    return elements.join('\n')
  }

  /** 水平線をSVGに変換する */
  private renderHr(box: LayoutBox): string {
    return `<line x1="${box.x}" y1="${box.y}" x2="${box.x + box.width}" y2="${box.y}" stroke="${box.style.color}" stroke-width="2" />`
  }
}

/** XMLエスケープ */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
