import type { LayoutBox, TextLine, TextSpan, SpanStyle } from '../types/layout'
import type { Renderer } from '../types/renderer'

const INLINE_CODE_BG = '#f6f8fa'
const INLINE_CODE_BORDER = '#d0d7de'
const INLINE_CODE_PAD = 4
const INLINE_CODE_PAD_V = 2

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
      case 'table':
        return this.renderTable(box)
      case 'table-row':
        return this.renderTableRow(box)
      case 'table-cell':
        return this.renderTableCell(box)
      case 'image':
        return this.renderImage(box)
      case 'footnote':
        return this.renderFootnote(box)
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

    const baselineY = y + line.height * 0.75
    const parts: string[] = []
    let cursorX = x

    for (const span of line.spans) {
      const w = span.width ?? 0
      const attrs = this.spanAttributes(span.style)
      const escaped = escapeXml(span.text)

      if (span.style.code) {
        // インラインコード: 背景矩形 + テキスト
        parts.push(
          `<rect x="${cursorX}" y="${y + INLINE_CODE_PAD_V}" width="${w + INLINE_CODE_PAD * 2}" height="${line.height - INLINE_CODE_PAD_V * 2}" rx="4" fill="${INLINE_CODE_BG}" stroke="${INLINE_CODE_BORDER}" stroke-width="0.5" />`,
        )
        parts.push(
          `<text x="${cursorX + INLINE_CODE_PAD}" y="${baselineY}" ${attrs}>${escaped}</text>`,
        )
        cursorX += w + INLINE_CODE_PAD * 2 + 2
      } else {
        parts.push(
          `<text x="${cursorX}" y="${baselineY}" ${attrs}>${escaped}</text>`,
        )

        // リンクの下線
        if (span.style.link) {
          const underlineY = baselineY + 2
          parts.push(
            `<line x1="${cursorX}" y1="${underlineY}" x2="${cursorX + w}" y2="${underlineY}" stroke="${span.style.color}" stroke-width="1" />`,
          )
        }

        // 取り消し線
        if (span.style.strikethrough) {
          const strikeY = y + line.height * 0.55
          parts.push(
            `<line x1="${cursorX}" y1="${strikeY}" x2="${cursorX + w}" y2="${strikeY}" stroke="${span.style.color}" stroke-width="1" />`,
          )
        }

        cursorX += w
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
      const baselineY = lineY + line.height * 0.75
      let cursorX = box.x + box.style.padding.left
      for (const span of line.spans) {
        if (span.text.length > 0) {
          const attrs = this.spanAttributes(span.style)
          elements.push(
            `<text x="${cursorX}" y="${baselineY}" ${attrs}>${escapeXml(span.text)}</text>`,
          )
        }
        cursorX += span.width ?? 0
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

  /** テーブルをSVGに変換する */
  private renderTable(box: LayoutBox): string {
    const elements: string[] = []

    // 外枠
    elements.push(
      `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="${box.style.borderColor ?? '#d0d7de'}" stroke-width="1" />`,
    )

    // 行を描画する
    for (const row of box.children) {
      elements.push(this.renderBox(row))
    }

    return elements.join('\n')
  }

  /** テーブル行をSVGに変換する */
  private renderTableRow(box: LayoutBox): string {
    const elements: string[] = []
    const borderColor = box.style.borderColor ?? '#d0d7de'

    // 行の下罫線
    elements.push(
      `<line x1="${box.x}" y1="${box.y + box.height}" x2="${box.x + box.width}" y2="${box.y + box.height}" stroke="${borderColor}" stroke-width="1" />`,
    )

    // セルを描画する
    for (const cell of box.children) {
      elements.push(this.renderBox(cell))
    }

    return elements.join('\n')
  }

  /** テーブルセルをSVGに変換する */
  private renderTableCell(box: LayoutBox): string {
    const elements: string[] = []
    const borderColor = box.style.borderColor ?? '#d0d7de'

    // ヘッダーの背景
    if (box.style.backgroundColor) {
      elements.push(
        `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${box.style.backgroundColor}" />`,
      )
    }

    // 右罫線
    elements.push(
      `<line x1="${box.x + box.width}" y1="${box.y}" x2="${box.x + box.width}" y2="${box.y + box.height}" stroke="${borderColor}" stroke-width="1" />`,
    )

    // セル内テキスト
    if (box.lines) {
      let lineY = box.y + box.style.padding.top
      for (const line of box.lines) {
        elements.push(this.renderTextLine(line, box.x + box.style.padding.left, lineY))
        lineY += line.height
      }
    }

    return elements.join('\n')
  }

  /** 画像をSVGに変換する */
  private renderImage(box: LayoutBox): string {
    const elements: string[] = []

    if (box.src) {
      elements.push(
        `<image x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" href="${escapeXml(box.src)}" preserveAspectRatio="xMidYMid meet" />`,
      )
    } else {
      // 画像が取得できなかった場合のフォールバック
      elements.push(
        `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="#f6f8fa" stroke="#d0d7de" stroke-width="1" rx="4" />`,
      )
      elements.push(
        `<text x="${box.x + box.width / 2}" y="${box.y + box.height / 2}" text-anchor="middle" dominant-baseline="middle" fill="#656d76" font-size="14">${escapeXml(box.alt ?? 'image')}</text>`,
      )
    }

    return elements.join('\n')
  }

  /** 脚注セクションをSVGに変換する */
  private renderFootnote(box: LayoutBox): string {
    const elements: string[] = []

    // 脚注コンテナ（親）の場合は区切り線を描画する
    if (box.children.length > 0) {
      elements.push(
        `<line x1="${box.x}" y1="${box.y}" x2="${box.x + box.width * 0.3}" y2="${box.y}" stroke="${box.style.borderColor ?? '#d0d7de'}" stroke-width="1" />`,
      )
      for (const child of box.children) {
        elements.push(this.renderBox(child))
      }
    } else if (box.lines) {
      // 個別の脚注項目はテキストブロックとして描画する
      let lineY = box.y
      for (const line of box.lines) {
        elements.push(this.renderTextLine(line, box.x, lineY))
        lineY += line.height
      }
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
