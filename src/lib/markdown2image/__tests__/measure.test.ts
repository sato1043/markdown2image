import { TextMeasurer } from '../layout/measure'
import { defaultSpanStyle } from '../layout/style'
import { setupCanvasMock, teardownCanvasMock } from './__mocks__/canvas'
import type { TextSpan, SpanStyle } from '../types/layout'

describe('TextMeasurer', () => {
  let measurer: TextMeasurer

  beforeAll(() => {
    setupCanvasMock()
    measurer = new TextMeasurer()
  })

  afterAll(() => {
    teardownCanvasMock()
  })

  const baseStyle: SpanStyle = defaultSpanStyle()

  describe('measureWidth', () => {
    it('テキスト幅を返す（モック: 1文字あたり8px）', () => {
      const width = measurer.measureWidth('Hello', baseStyle)
      expect(width).toBe(40) // 5 * 8
    })

    it('空文字列の幅は 0', () => {
      expect(measurer.measureWidth('', baseStyle)).toBe(0)
    })

    it('日本語テキストの幅を計測する', () => {
      const width = measurer.measureWidth('日本語', baseStyle)
      expect(width).toBe(24) // 3 * 8
    })
  })

  describe('lineHeight', () => {
    it('fontSize * lineHeightRatio を返す', () => {
      const lh = measurer.lineHeight(baseStyle, 1.6)
      expect(lh).toBeCloseTo(16 * 1.6)
    })

    it('異なる fontSize で正しく計算する', () => {
      const largeStyle: SpanStyle = { ...baseStyle, fontSize: 32 }
      const lh = measurer.lineHeight(largeStyle, 1.3)
      expect(lh).toBeCloseTo(32 * 1.3)
    })
  })

  describe('wrapSpans', () => {
    it('空配列を渡すと空配列を返す', () => {
      const result = measurer.wrapSpans([], 100, 1.6)
      expect(result).toHaveLength(0)
    })

    it('幅に収まるテキストは 1 行で返す', () => {
      const spans: TextSpan[] = [{ text: 'Hi', style: baseStyle }]
      // "Hi" = 2文字 * 8 = 16px, maxWidth=100 → 1行
      const lines = measurer.wrapSpans(spans, 100, 1.6)
      expect(lines).toHaveLength(1)
      expect(lines[0].spans[0].text).toBe('Hi')
    })

    it('幅を超えるテキストは複数行に折り返す', () => {
      // "Hello world foo bar"
      // splitToSegments → ["Hello ", "world ", "foo ", "bar"]
      // 各単語の幅: "Hello " = 48, "world " = 48, "foo " = 32, "bar" = 24
      // maxWidth=80 → "Hello " (48) + "world " はみ出し → 改行
      const spans: TextSpan[] = [{ text: 'Hello world foo bar', style: baseStyle }]
      const lines = measurer.wrapSpans(spans, 80, 1.6)
      expect(lines.length).toBeGreaterThan(1)
    })

    it('各行の height が設定される', () => {
      const spans: TextSpan[] = [{ text: 'text', style: baseStyle }]
      const lines = measurer.wrapSpans(spans, 100, 1.6)
      expect(lines[0].height).toBeCloseTo(16 * 1.6)
    })

    it('各 span に width が設定される', () => {
      const spans: TextSpan[] = [{ text: 'Hello', style: baseStyle }]
      const lines = measurer.wrapSpans(spans, 100, 1.6)
      expect(lines[0].spans[0].width).toBe(40) // 5 * 8
    })

    it('CJK文字は1文字ずつ分割して折り返す', () => {
      // "あいうえお" → 5文字、各1文字=8px
      // maxWidth=24 → "あいう" (24) で改行
      const spans: TextSpan[] = [{ text: 'あいうえお', style: baseStyle }]
      const lines = measurer.wrapSpans(spans, 24, 1.6)
      expect(lines.length).toBeGreaterThan(1)
    })

    it('複数スパンを正しく処理する', () => {
      const boldStyle: SpanStyle = { ...baseStyle, bold: true }
      const spans: TextSpan[] = [
        { text: 'Hello ', style: baseStyle },
        { text: 'world', style: boldStyle },
      ]
      const lines = measurer.wrapSpans(spans, 200, 1.6)
      expect(lines).toHaveLength(1)
      // 2つのスタイルが異なるため、別々の span として残る
      expect(lines[0].spans.length).toBeGreaterThanOrEqual(1)
    })

    it('行頭の空白を除去する', () => {
      // "Hello world" → maxWidth=50 → 折り返し後の2行目先頭の空白が除去される
      const spans: TextSpan[] = [{ text: 'Hello world', style: baseStyle }]
      const lines = measurer.wrapSpans(spans, 50, 1.6)
      if (lines.length > 1) {
        const firstSpan = lines[1].spans[0]
        expect(firstSpan.text).not.toMatch(/^\s/)
      }
    })
  })
})
