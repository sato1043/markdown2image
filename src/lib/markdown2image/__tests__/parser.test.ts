import { parseMarkdown } from '../parser/markdown'
import type { Root } from 'mdast'

describe('parseMarkdown', () => {
  it('空文字列を渡すと children が空の Root を返す', () => {
    const result = parseMarkdown('')
    expect(result.type).toBe('root')
    expect(result.children).toHaveLength(0)
  })

  it('見出し(h1〜h6)をパースする', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6'
    const result = parseMarkdown(md)
    const headings = result.children.filter(n => n.type === 'heading')
    expect(headings).toHaveLength(6)
    for (let i = 0; i < 6; i++) {
      expect((headings[i] as { depth: number }).depth).toBe(i + 1)
    }
  })

  it('段落をパースする', () => {
    const result = parseMarkdown('Hello world')
    expect(result.children).toHaveLength(1)
    expect(result.children[0].type).toBe('paragraph')
  })

  it('コードブロックをパースする', () => {
    const md = '```typescript\nconst x = 1\n```'
    const result = parseMarkdown(md)
    const code = result.children.find(n => n.type === 'code') as { type: 'code'; lang: string; value: string }
    expect(code).toBeDefined()
    expect(code.lang).toBe('typescript')
    expect(code.value).toBe('const x = 1')
  })

  it('引用ブロックをパースする', () => {
    const result = parseMarkdown('> quoted text')
    expect(result.children[0].type).toBe('blockquote')
  })

  it('順序なしリストをパースする', () => {
    const md = '- item1\n- item2\n- item3'
    const result = parseMarkdown(md)
    const list = result.children[0] as { type: 'list'; ordered: boolean; children: unknown[] }
    expect(list.type).toBe('list')
    expect(list.ordered).toBe(false)
    expect(list.children).toHaveLength(3)
  })

  it('順序付きリストをパースする', () => {
    const md = '1. first\n2. second'
    const result = parseMarkdown(md)
    const list = result.children[0] as { type: 'list'; ordered: boolean; children: unknown[] }
    expect(list.type).toBe('list')
    expect(list.ordered).toBe(true)
    expect(list.children).toHaveLength(2)
  })

  it('テーブルをパースする (GFM)', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |'
    const result = parseMarkdown(md)
    const table = result.children.find(n => n.type === 'table')
    expect(table).toBeDefined()
  })

  it('タスクリストをパースする (GFM)', () => {
    const md = '- [x] done\n- [ ] todo'
    const result = parseMarkdown(md)
    const list = result.children[0] as { type: 'list'; children: Array<{ checked: boolean | null }> }
    expect(list.children[0].checked).toBe(true)
    expect(list.children[1].checked).toBe(false)
  })

  it('水平線をパースする', () => {
    const result = parseMarkdown('---')
    expect(result.children[0].type).toBe('thematicBreak')
  })

  it('太字・斜体・インラインコードをパースする', () => {
    const md = '**bold** *italic* `code`'
    const result = parseMarkdown(md)
    const paragraph = result.children[0] as { children: Array<{ type: string }> }
    const types = paragraph.children.map(c => c.type)
    expect(types).toContain('strong')
    expect(types).toContain('emphasis')
    expect(types).toContain('inlineCode')
  })

  it('リンクをパースする', () => {
    const md = '[link](https://example.com)'
    const result = parseMarkdown(md)
    const paragraph = result.children[0] as { children: Array<{ type: string; url?: string }> }
    const link = paragraph.children.find(c => c.type === 'link')
    expect(link).toBeDefined()
    expect(link!.url).toBe('https://example.com')
  })

  it('取り消し線をパースする (GFM)', () => {
    const md = '~~deleted~~'
    const result = parseMarkdown(md)
    const paragraph = result.children[0] as { children: Array<{ type: string }> }
    expect(paragraph.children.some(c => c.type === 'delete')).toBe(true)
  })

  it('脚注参照と定義をパースする', () => {
    // remark-parse v9 + remark-gfm v1 では:
    //   [^1]: url → definition (identifier: "^1", url: "url")（先に出現する必要あり）
    //   [^1] → linkReference (identifier: "^1")
    const md = '[^1]: footnote-content\n\nSee[^1]'
    const result = parseMarkdown(md)

    // definition が存在する
    const def = result.children.find(n => n.type === 'definition') as { identifier: string; url: string } | undefined
    expect(def).toBeDefined()
    expect(def!.identifier).toBe('^1')
    expect(def!.url).toBe('footnote-content')

    // linkReference が存在する
    const paragraph = result.children.find(n => n.type === 'paragraph') as { children: Array<{ type: string; identifier?: string }> }
    const ref = paragraph.children.find(c => c.type === 'linkReference')
    expect(ref).toBeDefined()
    expect(ref!.identifier).toBe('^1')
  })

  it('日本語テキストをパースする', () => {
    const md = '# 見出し\n\nこれは日本語のテキストです'
    const result = parseMarkdown(md)
    expect(result.children).toHaveLength(2)
    expect(result.children[0].type).toBe('heading')
    expect(result.children[1].type).toBe('paragraph')
  })

  it('画像をパースする', () => {
    const md = '![alt text](https://example.com/image.png)'
    const result = parseMarkdown(md)
    // 画像は段落内の phrasingContent として出現する
    const paragraph = result.children[0] as { children: Array<{ type: string; url?: string; alt?: string }> }
    const image = paragraph.children.find(c => c.type === 'image')
    expect(image).toBeDefined()
    expect(image!.url).toBe('https://example.com/image.png')
    expect(image!.alt).toBe('alt text')
  })

  it('返り値の型が Root である', () => {
    const result: Root = parseMarkdown('test')
    expect(result.type).toBe('root')
  })
})
