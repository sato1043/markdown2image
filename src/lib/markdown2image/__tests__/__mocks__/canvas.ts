/**
 * Canvas 2D API の共有モック
 *
 * TextMeasurer は document.createElement('canvas') と getContext('2d') を使用する。
 * Node.js 環境ではこれらが存在しないため、テスト用のモックを提供する。
 *
 * measureText は text.length * 8 の固定幅を返すスタブとする。
 */

export interface MockCanvasContext {
  font: string
  measureText: jest.Mock<{ width: number }, [string]>
}

export interface MockCanvas {
  getContext: jest.Mock<MockCanvasContext | null, [string]>
}

/** モック CanvasRenderingContext2D を生成する */
export function createMockContext(): MockCanvasContext {
  return {
    font: '',
    measureText: jest.fn((text: string) => ({
      width: text.length * 8,
    })),
  }
}

/** モック canvas 要素を生成する */
export function createMockCanvas(): MockCanvas {
  const ctx = createMockContext()
  return {
    getContext: jest.fn((_id: string) => ctx),
  }
}

/** document.createElement をモックして Canvas を差し替えるセットアップ関数 */
export function setupCanvasMock(): MockCanvasContext {
  const mockCanvas = createMockCanvas()
  const ctx = mockCanvas.getContext('2d')!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).document = {
    createElement: jest.fn((_tag: string) => mockCanvas),
  }

  return ctx
}

/** Canvas モックをクリーンアップする */
export function teardownCanvasMock(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).document
}
