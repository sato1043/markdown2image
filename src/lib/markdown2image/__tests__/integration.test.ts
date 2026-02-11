import { markdownToSvg, markdownToPng } from '../index'
import { setupCanvasMock, teardownCanvasMock } from './__mocks__/canvas'
import type { CodeHighlighter } from '../types/renderer'
import { GITHUB_DARK } from '../theme/presets/github-dark'

// resolveImages は fetch に依存するためモックする
jest.mock('../image-resolver', () => ({
  resolveImages: jest.fn(async () => {}),
  fetchAsDataUri: jest.fn(),
  clearImageCache: jest.fn(),
}))

// svgToPng はブラウザ API に依存するためモックする
jest.mock('../renderer/png', () => ({
  svgToPng: jest.fn(async (svg: string) => new Blob([svg], { type: 'image/png' })),
}))

describe('統合関数', () => {
  beforeAll(() => {
    setupCanvasMock()
  })

  afterAll(() => {
    teardownCanvasMock()
  })

  describe('markdownToSvg', () => {
    it('SVG 文字列を返す', async () => {
      const svg = await markdownToSvg('# Hello')
      expect(svg).toContain('<svg')
      expect(svg).toContain('Hello')
    })

    it('オプションなしで動作する', async () => {
      const svg = await markdownToSvg('paragraph text')
      expect(svg).toContain('<svg')
      expect(svg).toContain('paragraph text')
    })

    it('highlighter オプションが反映される', async () => {
      const tokenize = jest.fn().mockReturnValue([
        [{ content: 'const', color: '#0000ff' }, { content: ' x', color: '#000000' }],
      ])
      const highlighter: CodeHighlighter = {
        getLoadedLanguages: () => ['typescript'],
        tokenize,
      }

      const svg = await markdownToSvg('```typescript\nconst x\n```', { highlighter })
      expect(tokenize).toHaveBeenCalled()
      expect(svg).toContain('<svg')
    })

    it('空文字列でも動作する', async () => {
      const svg = await markdownToSvg('')
      expect(svg).toContain('<svg')
    })

    it('複数のブロック要素を含む Markdown を処理する', async () => {
      const md = '# Title\n\nParagraph\n\n- item1\n- item2'
      const svg = await markdownToSvg(md)
      expect(svg).toContain('Title')
      expect(svg).toContain('Paragraph')
      expect(svg).toContain('item1')
    })

    it('theme プリセット名を指定できる', async () => {
      const svg = await markdownToSvg('# Hello', { theme: 'github-dark' })
      expect(svg).toContain('<svg')
      expect(svg).toContain(GITHUB_DARK.document.backgroundColor)
    })

    it('theme 部分上書きを指定できる', async () => {
      const svg = await markdownToSvg('# Hello', {
        theme: { base: 'github-dark', color: { link: '#ff6600' } },
      })
      expect(svg).toContain('<svg')
      expect(svg).toContain(GITHUB_DARK.document.backgroundColor)
    })

    it('テーマなしは github-light と同じ出力になる', async () => {
      const svgDefault = await markdownToSvg('# Hello')
      const svgLight = await markdownToSvg('# Hello', { theme: 'github-light' })
      expect(svgDefault).toBe(svgLight)
    })
  })

  describe('markdownToPng', () => {
    it('Blob を返す', async () => {
      const blob = await markdownToPng('# Hello')
      expect(blob).toBeInstanceOf(Blob)
    })

    it('markdownToSvg を経由して動作する', async () => {
      const { svgToPng } = jest.requireMock('../renderer/png') as {
        svgToPng: jest.Mock
      }
      svgToPng.mockClear()

      await markdownToPng('# Test')
      expect(svgToPng).toHaveBeenCalledTimes(1)
      // svgToPng に渡される引数は SVG 文字列である
      const svgArg = svgToPng.mock.calls[0][0] as string
      expect(svgArg).toContain('<svg')
    })

    it('highlighter オプションを markdownToSvg に渡す', async () => {
      const tokenize = jest.fn().mockReturnValue([
        [{ content: 'x', color: '#000' }],
      ])
      const highlighter: CodeHighlighter = {
        getLoadedLanguages: () => ['python'],
        tokenize,
      }

      const blob = await markdownToPng('```python\nx\n```', { highlighter })
      expect(blob).toBeInstanceOf(Blob)
      expect(tokenize).toHaveBeenCalled()
    })
  })
})
