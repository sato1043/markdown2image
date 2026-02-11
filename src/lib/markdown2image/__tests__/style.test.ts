import {
  DOCUMENT_WIDTH,
  DOCUMENT_PADDING,
  CONTENT_WIDTH,
  TABLE_CELL_PAD_H,
  documentStyle,
  headingStyle,
  paragraphStyle,
  codeBlockStyle,
  blockquoteStyle,
  listStyle,
  listItemStyle,
  hrStyle,
  tableStyle,
  tableCellStyle,
  imageStyle,
  footnoteBlockStyle,
  defaultSpanStyle,
  inlineCodeSpanStyle,
  linkSpanStyle,
} from '../layout/style'
import type { HeadingDepth } from '../types/layout'

describe('スタイル定数', () => {
  it('DOCUMENT_WIDTH は 800', () => {
    expect(DOCUMENT_WIDTH).toBe(800)
  })

  it('CONTENT_WIDTH は DOCUMENT_WIDTH - 左右パディング', () => {
    expect(CONTENT_WIDTH).toBe(DOCUMENT_WIDTH - DOCUMENT_PADDING.left - DOCUMENT_PADDING.right)
    expect(CONTENT_WIDTH).toBe(720)
  })

  it('DOCUMENT_PADDING は上下左右 40', () => {
    expect(DOCUMENT_PADDING).toEqual({ top: 40, right: 40, bottom: 40, left: 40 })
  })

  it('TABLE_CELL_PAD_H は 24', () => {
    expect(TABLE_CELL_PAD_H).toBe(24)
  })
})

describe('documentStyle', () => {
  it('backgroundColor が #ffffff である', () => {
    const style = documentStyle()
    expect(style.backgroundColor).toBe('#ffffff')
  })

  it('padding が DOCUMENT_PADDING と一致する', () => {
    const style = documentStyle()
    expect(style.padding).toEqual(DOCUMENT_PADDING)
  })
})

describe('headingStyle', () => {
  it('h1〜h6 で fontSize が異なる', () => {
    const sizes = ([1, 2, 3, 4, 5, 6] as HeadingDepth[]).map(d => headingStyle(d).fontSize)
    // h1 が最大、h6 が最小
    expect(sizes[0]).toBeGreaterThan(sizes[5])
    // 隣接する見出しレベルで fontSize が単調減少する
    for (let i = 0; i < 5; i++) {
      expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i + 1])
    }
  })

  it('h1 の fontSize は 32', () => {
    expect(headingStyle(1).fontSize).toBe(32)
  })

  it('h6 の fontSize は 14', () => {
    expect(headingStyle(6).fontSize).toBe(14)
  })

  it('lineHeight が 1.3 である', () => {
    expect(headingStyle(1).lineHeight).toBe(1.3)
  })

  it('margin.top が正の値を持つ', () => {
    for (const depth of [1, 2, 3, 4, 5, 6] as HeadingDepth[]) {
      expect(headingStyle(depth).margin.top).toBeGreaterThan(0)
    }
  })
})

describe('paragraphStyle', () => {
  it('fontSize が 16 である', () => {
    expect(paragraphStyle().fontSize).toBe(16)
  })

  it('margin.bottom が 16 である', () => {
    expect(paragraphStyle().margin.bottom).toBe(16)
  })
})

describe('codeBlockStyle', () => {
  it('fontFamily にモノスペースフォントを含む', () => {
    expect(codeBlockStyle().fontFamily).toContain('monospace')
  })

  it('fontSize が 14 である', () => {
    expect(codeBlockStyle().fontSize).toBe(14)
  })

  it('backgroundColor が設定されている', () => {
    expect(codeBlockStyle().backgroundColor).toBeDefined()
  })

  it('padding が四方向すべて 16 である', () => {
    const p = codeBlockStyle().padding
    expect(p).toEqual({ top: 16, right: 16, bottom: 16, left: 16 })
  })
})

describe('blockquoteStyle', () => {
  it('color がグレー系である', () => {
    expect(blockquoteStyle().color).toBe('#656d76')
  })

  it('borderColor が設定されている', () => {
    expect(blockquoteStyle().borderColor).toBeDefined()
  })

  it('padding.left が正の値を持つ', () => {
    expect(blockquoteStyle().padding.left).toBeGreaterThan(0)
  })
})

describe('listStyle', () => {
  it('padding.left が 24 である', () => {
    expect(listStyle().padding.left).toBe(24)
  })
})

describe('listItemStyle', () => {
  it('margin.bottom が 4 である', () => {
    expect(listItemStyle().margin.bottom).toBe(4)
  })
})

describe('hrStyle', () => {
  it('margin.top と margin.bottom が 24 である', () => {
    const style = hrStyle()
    expect(style.margin.top).toBe(24)
    expect(style.margin.bottom).toBe(24)
  })
})

describe('tableStyle', () => {
  it('borderColor が設定されている', () => {
    expect(tableStyle().borderColor).toBeDefined()
  })
})

describe('tableCellStyle', () => {
  it('ヘッダーセルには backgroundColor が設定される', () => {
    expect(tableCellStyle(true).backgroundColor).toBeDefined()
  })

  it('非ヘッダーセルには backgroundColor が未定義', () => {
    expect(tableCellStyle(false).backgroundColor).toBeUndefined()
  })

  it('パディングが設定されている', () => {
    const style = tableCellStyle(false)
    expect(style.padding.left).toBeGreaterThan(0)
    expect(style.padding.right).toBeGreaterThan(0)
  })
})

describe('imageStyle', () => {
  it('margin.bottom が 16 である', () => {
    expect(imageStyle().margin.bottom).toBe(16)
  })
})

describe('footnoteBlockStyle', () => {
  it('fontSize が 13 である', () => {
    expect(footnoteBlockStyle().fontSize).toBe(13)
  })

  it('color がグレー系である', () => {
    expect(footnoteBlockStyle().color).toBe('#656d76')
  })

  it('padding.top が正の値を持つ', () => {
    expect(footnoteBlockStyle().padding.top).toBeGreaterThan(0)
  })
})

describe('defaultSpanStyle', () => {
  it('bold/italic/code/strikethrough がすべて false である', () => {
    const style = defaultSpanStyle()
    expect(style.bold).toBe(false)
    expect(style.italic).toBe(false)
    expect(style.code).toBe(false)
    expect(style.strikethrough).toBe(false)
  })

  it('link が未定義である', () => {
    expect(defaultSpanStyle().link).toBeUndefined()
  })

  it('fontSize が 16 である', () => {
    expect(defaultSpanStyle().fontSize).toBe(16)
  })
})

describe('inlineCodeSpanStyle', () => {
  it('code が true である', () => {
    expect(inlineCodeSpanStyle().code).toBe(true)
  })

  it('fontFamily にモノスペースフォントを含む', () => {
    expect(inlineCodeSpanStyle().fontFamily).toContain('monospace')
  })

  it('fontSize が 14 である', () => {
    expect(inlineCodeSpanStyle().fontSize).toBe(14)
  })
})

describe('linkSpanStyle', () => {
  it('color が青系である', () => {
    expect(linkSpanStyle().color).toBe('#0969da')
  })
})
