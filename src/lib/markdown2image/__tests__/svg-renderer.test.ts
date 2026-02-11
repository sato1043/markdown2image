import { SvgRenderer } from '../renderer/svg'
import type { LayoutBox, SpanStyle, BoxStyle, TextLine, Spacing } from '../types/layout'

/** テスト用のゼロスペーシング */
const ZERO: Spacing = { top: 0, right: 0, bottom: 0, left: 0 }

/** テスト用の基本 BoxStyle */
function baseBoxStyle(overrides?: Partial<BoxStyle>): BoxStyle {
  return {
    fontFamily: 'sans-serif',
    fontSize: 16,
    lineHeight: 1.6,
    color: '#000000',
    padding: ZERO,
    margin: ZERO,
    ...overrides,
  }
}

/** テスト用の基本 SpanStyle */
function baseSpanStyle(overrides?: Partial<SpanStyle>): SpanStyle {
  return {
    bold: false,
    italic: false,
    code: false,
    strikethrough: false,
    color: '#000000',
    fontFamily: 'sans-serif',
    fontSize: 16,
    ...overrides,
  }
}

/** テスト用のテキスト行を生成する */
function textLine(text: string, style?: Partial<SpanStyle>, width = 100): TextLine {
  const spanStyle = baseSpanStyle(style)
  return {
    spans: [{ text, style: spanStyle, width }],
    width,
    height: 25.6,
  }
}

describe('SvgRenderer', () => {
  let renderer: SvgRenderer

  beforeAll(() => {
    renderer = new SvgRenderer()
  })

  describe('SVG ルート要素', () => {
    it('svg タグを出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
      expect(svg).toContain('width="800"')
      expect(svg).toContain('height="600"')
      expect(svg).toContain('</svg>')
    })

    it('背景矩形を出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('fill="#ffffff"')
    })
  })

  describe('テキスト描画', () => {
    it('heading のテキストを <text> 要素で出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'heading',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [],
            lines: [textLine('Title', { bold: true })],
            depth: 1,
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('>Title</text>')
      expect(svg).toContain('font-weight="bold"')
    })

    it('paragraph のテキストを出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'paragraph',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [],
            lines: [textLine('Hello world')],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('>Hello world</text>')
    })

    it('italic テキストに font-style="italic" を付ける', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'paragraph',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [],
            lines: [textLine('italic text', { italic: true })],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('font-style="italic"')
    })

    it('リンクに下線を描画する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'paragraph',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [],
            lines: [textLine('click here', { link: 'https://example.com', color: '#0969da' })],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('<line')
      expect(svg).toContain('stroke="#0969da"')
    })

    it('取り消し線を描画する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'paragraph',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [],
            lines: [textLine('deleted', { strikethrough: true })],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('<line')
    })

    it('インラインコードに背景矩形を描画する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'paragraph',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [],
            lines: [textLine('code', { code: true, fontFamily: 'monospace', fontSize: 14 })],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('fill="#f6f8fa"') // INLINE_CODE_BG
      expect(svg).toContain('rx="4"')
    })
  })

  describe('コードブロック描画', () => {
    it('背景矩形とコードテキストを出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'code-block',
            x: 40,
            y: 40,
            width: 720,
            height: 53,
            style: baseBoxStyle({
              backgroundColor: '#f6f8fa',
              borderColor: '#d0d7de',
              padding: { top: 16, right: 16, bottom: 16, left: 16 },
            }),
            children: [],
            lines: [textLine('const x = 1', { code: true })],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('rx="6"')
      expect(svg).toContain('fill="#f6f8fa"')
      expect(svg).toContain('>const x = 1</text>')
    })
  })

  describe('引用ブロック描画', () => {
    it('左ボーダーと子要素を出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'blockquote',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle({ borderColor: '#d0d7de' }),
            children: [
              {
                type: 'paragraph',
                x: 56,
                y: 40,
                width: 704,
                height: 25.6,
                style: baseBoxStyle(),
                children: [],
                lines: [textLine('quoted')],
              },
            ],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('stroke-width="4"')
      expect(svg).toContain('stroke-linecap="round"')
      expect(svg).toContain('>quoted</text>')
    })
  })

  describe('リスト描画', () => {
    it('リストアイテムのマーカーを描画する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'list',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [
              {
                type: 'list-item',
                x: 64,
                y: 40,
                width: 696,
                height: 25.6,
                style: baseBoxStyle(),
                children: [
                  {
                    type: 'paragraph',
                    x: 64,
                    y: 40,
                    width: 696,
                    height: 25.6,
                    style: baseBoxStyle(),
                    children: [],
                    lines: [textLine('item text')],
                  },
                ],
                marker: '\u2022 ',
              },
            ],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('\u2022')
      expect(svg).toContain('>item text</text>')
    })
  })

  describe('テーブル描画', () => {
    it('外枠、行罫線、セルを出力する', () => {
      const headerCellStyle = baseBoxStyle({
        backgroundColor: '#f6f8fa',
        borderColor: '#d0d7de',
        padding: { top: 6, right: 12, bottom: 6, left: 12 },
      })
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'table',
            x: 40,
            y: 40,
            width: 720,
            height: 70,
            style: baseBoxStyle({ borderColor: '#d0d7de' }),
            children: [
              {
                type: 'table-row',
                x: 40,
                y: 40,
                width: 360,
                height: 35,
                style: baseBoxStyle({ borderColor: '#d0d7de' }),
                children: [
                  {
                    type: 'table-cell',
                    x: 40,
                    y: 40,
                    width: 180,
                    height: 35,
                    style: headerCellStyle,
                    children: [],
                    lines: [textLine('Header', { bold: true }, 50)],
                  },
                ],
              },
            ],
          },
        ],
      }
      const svg = renderer.render(doc)
      // 外枠
      expect(svg).toContain('fill="none"')
      expect(svg).toContain('stroke="#d0d7de"')
      // ヘッダー背景
      expect(svg).toContain('fill="#f6f8fa"')
      // テキスト
      expect(svg).toContain('>Header</text>')
    })
  })

  describe('画像描画', () => {
    it('src がある場合 <image> 要素を出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 300,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'image',
            x: 40,
            y: 40,
            width: 720,
            height: 200,
            style: baseBoxStyle(),
            children: [],
            src: 'data:image/png;base64,ABC',
            alt: 'photo',
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('<image')
      expect(svg).toContain('href="data:image/png;base64,ABC"')
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"')
    })

    it('src がない場合フォールバック矩形と alt テキストを出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 300,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'image',
            x: 40,
            y: 40,
            width: 720,
            height: 200,
            style: baseBoxStyle(),
            children: [],
            alt: 'missing image',
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).not.toContain('<image')
      expect(svg).toContain('text-anchor="middle"')
      expect(svg).toContain('>missing image</text>')
    })
  })

  describe('水平線描画', () => {
    it('<line> 要素を出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'hr',
            x: 40,
            y: 64,
            width: 720,
            height: 2,
            style: baseBoxStyle({ color: '#d0d7de' }),
            children: [],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('<line')
      expect(svg).toContain('stroke="#d0d7de"')
      expect(svg).toContain('stroke-width="2"')
    })
  })

  describe('脚注描画', () => {
    it('区切り線と脚注テキストを出力する', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 300,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'footnote',
            x: 40,
            y: 200,
            width: 720,
            height: 50,
            style: baseBoxStyle({ borderColor: '#d0d7de' }),
            children: [
              {
                type: 'footnote',
                x: 40,
                y: 216,
                width: 720,
                height: 25.6,
                style: baseBoxStyle(),
                children: [],
                lines: [textLine('1. footnote text')],
              },
            ],
          },
        ],
      }
      const svg = renderer.render(doc)
      // 区切り線
      expect(svg).toContain('<line')
      // 脚注テキスト
      expect(svg).toContain('>1. footnote text</text>')
    })
  })

  describe('XMLエスケープ', () => {
    it('特殊文字がエスケープされる', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'paragraph',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [],
            lines: [textLine('<script>alert("xss")</script>')],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).not.toContain('<script>')
      expect(svg).toContain('&lt;script&gt;')
      expect(svg).toContain('&quot;')
    })

    it('アンパサンドがエスケープされる', () => {
      const doc: LayoutBox = {
        type: 'document',
        x: 0,
        y: 0,
        width: 800,
        height: 200,
        style: baseBoxStyle({ backgroundColor: '#ffffff' }),
        children: [
          {
            type: 'paragraph',
            x: 40,
            y: 40,
            width: 720,
            height: 25.6,
            style: baseBoxStyle(),
            children: [],
            lines: [textLine('A & B')],
          },
        ],
      }
      const svg = renderer.render(doc)
      expect(svg).toContain('A &amp; B')
    })
  })
})
