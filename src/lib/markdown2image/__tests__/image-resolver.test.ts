import { fetchAsDataUri, resolveImages, clearImageCache } from '../image-resolver'
import type { LayoutBox } from '../types/layout'

/** テスト用の基本 LayoutBox を生成する */
function makeBox(overrides?: Partial<LayoutBox>): LayoutBox {
  return {
    type: 'paragraph',
    x: 0,
    y: 0,
    width: 720,
    height: 25.6,
    style: {
      fontFamily: 'sans-serif',
      fontSize: 16,
      lineHeight: 1.6,
      color: '#000000',
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    children: [],
    ...overrides,
  }
}

describe('image-resolver', () => {
  const originalFetch = globalThis.fetch
  const originalFileReader = globalThis.FileReader

  beforeEach(() => {
    clearImageCache()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    globalThis.FileReader = originalFileReader
  })

  describe('fetchAsDataUri', () => {
    it('URL を fetch して data URI に変換する', async () => {
      const mockBlob = new Blob(['dummy'], { type: 'image/png' })

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      // FileReader のモック
      const mockFileReader = {
        result: 'data:image/png;base64,ZHVtbXk=',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        readAsDataURL: jest.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) this.onload()
        }),
      }
      globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader

      const result = await fetchAsDataUri('https://example.com/img.png')
      expect(result).toBe('data:image/png;base64,ZHVtbXk=')
      expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/img.png')
    })

    it('キャッシュされた URL は再 fetch しない', async () => {
      const mockBlob = new Blob(['dummy'], { type: 'image/png' })

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const mockFileReader = {
        result: 'data:image/png;base64,cached',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        readAsDataURL: jest.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) this.onload()
        }),
      }
      globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader

      // 1回目
      await fetchAsDataUri('https://example.com/cached.png')
      // 2回目: キャッシュから取得
      const result = await fetchAsDataUri('https://example.com/cached.png')

      expect(result).toBe('data:image/png;base64,cached')
      expect(globalThis.fetch).toHaveBeenCalledTimes(1) // 1回のみ
    })

    it('fetch が失敗した場合は元の URL を返す', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const result = await fetchAsDataUri('https://example.com/fail.png')
      expect(result).toBe('https://example.com/fail.png')
    })

    it('response.ok が false の場合は元の URL を返す', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      const result = await fetchAsDataUri('https://example.com/404.png')
      expect(result).toBe('https://example.com/404.png')
    })
  })

  describe('resolveImages', () => {
    it('image ボックスの src を data URI に変換する', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['img'], { type: 'image/png' })),
      })

      const mockFileReader = {
        result: 'data:image/png;base64,resolved',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        readAsDataURL: jest.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) this.onload()
        }),
      }
      globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader

      const box = makeBox({
        type: 'image',
        src: 'https://example.com/photo.png',
      })

      await resolveImages(box)
      expect(box.src).toBe('data:image/png;base64,resolved')
    })

    it('data: で始まる src はスキップする', async () => {
      globalThis.fetch = jest.fn()

      const box = makeBox({
        type: 'image',
        src: 'data:image/png;base64,already',
      })

      await resolveImages(box)
      expect(box.src).toBe('data:image/png;base64,already')
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it('再帰的に子要素の画像を解決する', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['img'], { type: 'image/png' })),
      })

      const mockFileReader = {
        result: 'data:image/png;base64,child',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        readAsDataURL: jest.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) this.onload()
        }),
      }
      globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader

      const parent = makeBox({
        type: 'document',
        children: [
          makeBox({ type: 'image', src: 'https://example.com/child.png' }),
        ],
      })

      await resolveImages(parent)
      expect(parent.children[0].src).toBe('data:image/png;base64,child')
    })

    it('image 以外のボックスは変更しない', async () => {
      globalThis.fetch = jest.fn()

      const box = makeBox({ type: 'paragraph' })
      await resolveImages(box)
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })
  })

  describe('clearImageCache', () => {
    it('キャッシュクリア後は再 fetch する', async () => {
      const mockBlob = new Blob(['dummy'], { type: 'image/png' })

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const mockFileReader = {
        result: 'data:image/png;base64,fresh',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        readAsDataURL: jest.fn(function (this: { onload: (() => void) | null }) {
          if (this.onload) this.onload()
        }),
      }
      globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader

      // 1回目
      await fetchAsDataUri('https://example.com/clear.png')
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)

      // キャッシュクリア
      clearImageCache()

      // 2回目: 再 fetch される
      await fetchAsDataUri('https://example.com/clear.png')
      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    })
  })
})
