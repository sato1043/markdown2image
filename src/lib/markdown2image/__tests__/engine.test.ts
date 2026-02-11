import { LayoutEngine } from '../layout/engine'
import { parseMarkdown } from '../parser/markdown'
import { setupCanvasMock, teardownCanvasMock } from './__mocks__/canvas'
import { DOCUMENT_WIDTH, DOCUMENT_PADDING, CONTENT_WIDTH } from '../layout/style'
import type { CodeHighlighter } from '../types/renderer'
import type { LayoutBox } from '../types/layout'

describe('LayoutEngine', () => {
  let engine: LayoutEngine

  beforeAll(() => {
    setupCanvasMock()
    engine = new LayoutEngine()
  })

  afterAll(() => {
    teardownCanvasMock()
  })

  /** パースしてレイアウトするヘルパー */
  function layoutMarkdown(md: string): LayoutBox {
    const ast = parseMarkdown(md)
    return engine.layout(ast)
  }

  describe('document 構造', () => {
    it('type が document である', () => {
      const doc = layoutMarkdown('')
      expect(doc.type).toBe('document')
    })

    it('width が DOCUMENT_WIDTH (800) である', () => {
      const doc = layoutMarkdown('')
      expect(doc.width).toBe(DOCUMENT_WIDTH)
    })

    it('空Markdownでも height が DOCUMENT_PADDING の上下合計以上', () => {
      const doc = layoutMarkdown('')
      expect(doc.height).toBeGreaterThanOrEqual(DOCUMENT_PADDING.top + DOCUMENT_PADDING.bottom)
    })

    it('x, y が 0 である', () => {
      const doc = layoutMarkdown('')
      expect(doc.x).toBe(0)
      expect(doc.y).toBe(0)
    })
  })

  describe('heading レイアウト', () => {
    it('見出しの type が heading である', () => {
      const doc = layoutMarkdown('# Title')
      expect(doc.children[0].type).toBe('heading')
    })

    it('depth が正しく設定される', () => {
      const doc = layoutMarkdown('## Sub Title')
      expect(doc.children[0].depth).toBe(2)
    })

    it('lines が生成される', () => {
      const doc = layoutMarkdown('# Hello')
      expect(doc.children[0].lines).toBeDefined()
      expect(doc.children[0].lines!.length).toBeGreaterThan(0)
    })

    it('width が CONTENT_WIDTH (720) である', () => {
      const doc = layoutMarkdown('# Title')
      expect(doc.children[0].width).toBe(CONTENT_WIDTH)
    })

    it('x が DOCUMENT_PADDING.left (40) である', () => {
      const doc = layoutMarkdown('# Title')
      expect(doc.children[0].x).toBe(DOCUMENT_PADDING.left)
    })

    it('見出しテキストの span は bold である', () => {
      const doc = layoutMarkdown('# Title')
      const firstSpan = doc.children[0].lines![0].spans[0]
      expect(firstSpan.style.bold).toBe(true)
    })
  })

  describe('paragraph レイアウト', () => {
    it('type が paragraph である', () => {
      const doc = layoutMarkdown('Hello world')
      expect(doc.children[0].type).toBe('paragraph')
    })

    it('lines にテキストが含まれる', () => {
      const doc = layoutMarkdown('Hello world')
      const lines = doc.children[0].lines!
      expect(lines.length).toBeGreaterThan(0)
      const allText = lines.flatMap(l => l.spans.map(s => s.text)).join('')
      expect(allText).toContain('Hello')
    })

    it('height が正の値を持つ', () => {
      const doc = layoutMarkdown('Some text')
      expect(doc.children[0].height).toBeGreaterThan(0)
    })
  })

  describe('code-block レイアウト', () => {
    it('type が code-block である', () => {
      const doc = layoutMarkdown('```\ncode\n```')
      expect(doc.children[0].type).toBe('code-block')
    })

    it('language が設定される', () => {
      const doc = layoutMarkdown('```typescript\nconst x = 1\n```')
      expect(doc.children[0].language).toBe('typescript')
    })

    it('code に元のコードが保持される', () => {
      const doc = layoutMarkdown('```\nline1\nline2\n```')
      expect(doc.children[0].code).toBe('line1\nline2')
    })

    it('height にパディングが含まれる', () => {
      const doc = layoutMarkdown('```\ncode\n```')
      const box = doc.children[0]
      expect(box.height).toBeGreaterThan(0)
      // パディング (上16 + 下16 = 32) が含まれる
      expect(box.height).toBeGreaterThanOrEqual(32)
    })

    it('lines が各コード行に対応する', () => {
      const doc = layoutMarkdown('```\nline1\nline2\nline3\n```')
      expect(doc.children[0].lines!).toHaveLength(3)
    })
  })

  describe('blockquote レイアウト', () => {
    it('type が blockquote である', () => {
      const doc = layoutMarkdown('> quoted')
      expect(doc.children[0].type).toBe('blockquote')
    })

    it('子要素に段落が含まれる', () => {
      const doc = layoutMarkdown('> quoted text')
      expect(doc.children[0].children.length).toBeGreaterThan(0)
      expect(doc.children[0].children[0].type).toBe('paragraph')
    })

    it('内部要素の x が padding.left 分だけオフセットされる', () => {
      const doc = layoutMarkdown('> text')
      const bq = doc.children[0]
      const innerParagraph = bq.children[0]
      expect(innerParagraph.x).toBeGreaterThan(bq.x)
    })
  })

  describe('list レイアウト', () => {
    it('順序なしリストの type が list である', () => {
      const doc = layoutMarkdown('- item1\n- item2')
      expect(doc.children[0].type).toBe('list')
    })

    it('子要素が list-item である', () => {
      const doc = layoutMarkdown('- a\n- b')
      const list = doc.children[0]
      expect(list.children).toHaveLength(2)
      expect(list.children[0].type).toBe('list-item')
      expect(list.children[1].type).toBe('list-item')
    })

    it('順序なしリストのマーカーが bullet 文字である', () => {
      const doc = layoutMarkdown('- item')
      const item = doc.children[0].children[0]
      expect(item.marker).toBe('\u2022 ')
    })

    it('順序付きリストのマーカーが数字付きである', () => {
      const doc = layoutMarkdown('1. first\n2. second')
      const list = doc.children[0]
      expect(list.children[0].marker).toBe('1. ')
      expect(list.children[1].marker).toBe('2. ')
    })

    it('タスクリストのマーカーがチェックボックスである', () => {
      const doc = layoutMarkdown('- [x] done\n- [ ] todo')
      const list = doc.children[0]
      expect(list.children[0].marker).toBe('\u2611 ')
      expect(list.children[1].marker).toBe('\u2610 ')
    })
  })

  describe('table レイアウト', () => {
    it('type が table である', () => {
      const doc = layoutMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
      expect(doc.children[0].type).toBe('table')
    })

    it('子要素が table-row である', () => {
      const doc = layoutMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
      const table = doc.children[0]
      // ヘッダー行 + データ行
      expect(table.children).toHaveLength(2)
      expect(table.children[0].type).toBe('table-row')
    })

    it('table-row の子要素が table-cell である', () => {
      const doc = layoutMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
      const firstRow = doc.children[0].children[0]
      expect(firstRow.children).toHaveLength(2)
      expect(firstRow.children[0].type).toBe('table-cell')
    })

    it('ヘッダーセルの背景色が設定される', () => {
      const doc = layoutMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
      const headerRow = doc.children[0].children[0]
      expect(headerRow.children[0].style.backgroundColor).toBeDefined()
    })

    it('全セルの高さが行の最大高さに揃う', () => {
      const doc = layoutMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
      const row = doc.children[0].children[0]
      const heights = row.children.map(c => c.height)
      expect(new Set(heights).size).toBe(1) // 全セル同じ高さ
    })
  })

  describe('hr レイアウト', () => {
    it('type が hr である', () => {
      const doc = layoutMarkdown('---')
      expect(doc.children[0].type).toBe('hr')
    })

    it('height が 2 である', () => {
      const doc = layoutMarkdown('---')
      expect(doc.children[0].height).toBe(2)
    })
  })

  describe('image レイアウト', () => {
    it('type が image である', () => {
      const doc = layoutMarkdown('![alt](https://example.com/img.png)')
      expect(doc.children[0].type).toBe('image')
    })

    it('src と alt が設定される', () => {
      const doc = layoutMarkdown('![my image](https://example.com/img.png)')
      const img = doc.children[0]
      expect(img.src).toBe('https://example.com/img.png')
      expect(img.alt).toBe('my image')
    })

    it('固定高さ (200px) のプレースホルダーである', () => {
      const doc = layoutMarkdown('![alt](https://example.com/img.png)')
      expect(doc.children[0].height).toBe(200)
    })
  })

  describe('脚注レイアウト', () => {
    it('脚注定義がドキュメント末尾に配置される', () => {
      // definition が先に来る必要がある
      const doc = layoutMarkdown('[^1]: footnote-text\n\nSee[^1]')
      const lastChild = doc.children[doc.children.length - 1]
      expect(lastChild.type).toBe('footnote')
    })

    it('脚注ブロックに子要素が含まれる', () => {
      const doc = layoutMarkdown('[^1]: note-one\n\n[^2]: note-two\n\nText[^1][^2]')
      const footnoteBlock = doc.children[doc.children.length - 1]
      expect(footnoteBlock.children.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('インラインスタイル', () => {
    it('太字テキストの span が bold=true である', () => {
      const doc = layoutMarkdown('**bold text**')
      const spans = doc.children[0].lines![0].spans
      const boldSpan = spans.find(s => s.text.includes('bold'))
      expect(boldSpan).toBeDefined()
      expect(boldSpan!.style.bold).toBe(true)
    })

    it('斜体テキストの span が italic=true である', () => {
      const doc = layoutMarkdown('*italic text*')
      const spans = doc.children[0].lines![0].spans
      const italicSpan = spans.find(s => s.text.includes('italic'))
      expect(italicSpan).toBeDefined()
      expect(italicSpan!.style.italic).toBe(true)
    })

    it('インラインコードの span が code=true である', () => {
      const doc = layoutMarkdown('use `code` here')
      const spans = doc.children[0].lines![0].spans
      const codeSpan = spans.find(s => s.text === 'code')
      expect(codeSpan).toBeDefined()
      expect(codeSpan!.style.code).toBe(true)
    })

    it('リンクの span に link URL が設定される', () => {
      const doc = layoutMarkdown('[click](https://example.com)')
      const spans = doc.children[0].lines![0].spans
      const linkSpan = spans.find(s => s.style.link)
      expect(linkSpan).toBeDefined()
      expect(linkSpan!.style.link).toBe('https://example.com')
    })

    it('取り消し線の span が strikethrough=true である', () => {
      const doc = layoutMarkdown('~~deleted~~')
      const spans = doc.children[0].lines![0].spans
      const strikeSpan = spans.find(s => s.text.includes('deleted'))
      expect(strikeSpan).toBeDefined()
      expect(strikeSpan!.style.strikethrough).toBe(true)
    })

    it('インライン画像は alt テキストとして表示される', () => {
      const doc = layoutMarkdown('text ![alt](url) more')
      const spans = doc.children[0].lines!.flatMap(l => l.spans)
      const imgSpan = spans.find(s => s.text.includes('[alt]'))
      expect(imgSpan).toBeDefined()
    })
  })

  describe('CodeHighlighter 統合', () => {
    it('ハイライターが設定されている場合トークナイズされる', () => {
      const highlighter: CodeHighlighter = {
        getLoadedLanguages: () => ['typescript'],
        tokenize: (_code, _lang, _theme) => [
          [
            { content: 'const', color: '#0000ff', fontStyle: 1 },
            { content: ' x = ', color: '#000000' },
            { content: '1', color: '#098658' },
          ],
        ],
      }

      const engineWithHl = new LayoutEngine()
      engineWithHl.setHighlighter(highlighter)

      const ast = parseMarkdown('```typescript\nconst x = 1\n```')
      const doc = engineWithHl.layout(ast)
      const codeBlock = doc.children[0]

      expect(codeBlock.lines!).toHaveLength(1)
      expect(codeBlock.lines![0].spans).toHaveLength(3)
      expect(codeBlock.lines![0].spans[0].style.color).toBe('#0000ff')
      expect(codeBlock.lines![0].spans[0].style.bold).toBe(true)
    })

    it('ハイライターが未設定の場合フォールバックする', () => {
      const ast = parseMarkdown('```typescript\nconst x = 1\n```')
      const doc = engine.layout(ast)
      const codeBlock = doc.children[0]

      // フォールバック: 1行1スパン
      expect(codeBlock.lines!).toHaveLength(1)
      expect(codeBlock.lines![0].spans).toHaveLength(1)
    })

    it('言語が未ロードの場合フォールバックする', () => {
      const highlighter: CodeHighlighter = {
        getLoadedLanguages: () => ['javascript'],
        tokenize: () => [],
      }

      const engineWithHl = new LayoutEngine()
      engineWithHl.setHighlighter(highlighter)

      const ast = parseMarkdown('```rust\nfn main() {}\n```')
      const doc = engineWithHl.layout(ast)
      const codeBlock = doc.children[0]

      // rust は未ロード → フォールバック
      expect(codeBlock.lines!).toHaveLength(1)
      expect(codeBlock.lines![0].spans).toHaveLength(1)
    })
  })

  describe('垂直配置', () => {
    it('複数ブロック要素が垂直に並ぶ', () => {
      const doc = layoutMarkdown('# Title\n\nParagraph\n\n---')
      const [heading, paragraph, hr] = doc.children
      expect(heading.y).toBeLessThan(paragraph.y)
      expect(paragraph.y).toBeLessThan(hr.y)
    })

    it('document の height が最後の要素の下端 + パディングを含む', () => {
      const doc = layoutMarkdown('# Title\n\nText')
      const lastChild = doc.children[doc.children.length - 1]
      const lastBottom = lastChild.y + lastChild.height + lastChild.style.margin.bottom
      expect(doc.height).toBe(lastBottom + DOCUMENT_PADDING.bottom)
    })
  })
})
