import { createStyleFactory } from '../layout/style'
import { GITHUB_LIGHT } from '../theme/presets/github-light'
import { GITHUB_DARK } from '../theme/presets/github-dark'
import type { HeadingDepth } from '../types/layout'

// 既存エクスポート（デフォルトファクトリ経由）
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

describe('createStyleFactory', () => {
  describe('github-light ファクトリ', () => {
    const factory = createStyleFactory(GITHUB_LIGHT)

    it('theme プロパティがテーマオブジェクトを参照する', () => {
      expect(factory.theme).toBe(GITHUB_LIGHT)
    })

    it('documentWidth() が DOCUMENT_WIDTH と等価', () => {
      expect(factory.documentWidth()).toBe(DOCUMENT_WIDTH)
    })

    it('documentPadding() が DOCUMENT_PADDING と等価', () => {
      expect(factory.documentPadding()).toEqual(DOCUMENT_PADDING)
    })

    it('contentWidth() が CONTENT_WIDTH と等価', () => {
      expect(factory.contentWidth()).toBe(CONTENT_WIDTH)
    })

    it('tableCellPadH() が TABLE_CELL_PAD_H と等価', () => {
      expect(factory.tableCellPadH()).toBe(TABLE_CELL_PAD_H)
    })

    it('documentStyle() が既存関数と等価', () => {
      expect(factory.documentStyle()).toEqual(documentStyle())
    })

    it('headingStyle(1) が既存関数と等価', () => {
      expect(factory.headingStyle(1)).toEqual(headingStyle(1))
    })

    it('headingStyle(1-6) が全て既存関数と等価', () => {
      for (const depth of [1, 2, 3, 4, 5, 6] as HeadingDepth[]) {
        expect(factory.headingStyle(depth)).toEqual(headingStyle(depth))
      }
    })

    it('paragraphStyle() が既存関数と等価', () => {
      expect(factory.paragraphStyle()).toEqual(paragraphStyle())
    })

    it('codeBlockStyle() が既存関数と等価', () => {
      expect(factory.codeBlockStyle()).toEqual(codeBlockStyle())
    })

    it('blockquoteStyle() が既存関数と等価', () => {
      expect(factory.blockquoteStyle()).toEqual(blockquoteStyle())
    })

    it('listStyle() が既存関数と等価', () => {
      expect(factory.listStyle()).toEqual(listStyle())
    })

    it('listItemStyle() が既存関数と等価', () => {
      expect(factory.listItemStyle()).toEqual(listItemStyle())
    })

    it('hrStyle() が既存関数と等価', () => {
      expect(factory.hrStyle()).toEqual(hrStyle())
    })

    it('tableStyle() が既存関数と等価', () => {
      expect(factory.tableStyle()).toEqual(tableStyle())
    })

    it('tableCellStyle(true) が既存関数と等価', () => {
      expect(factory.tableCellStyle(true)).toEqual(tableCellStyle(true))
    })

    it('tableCellStyle(false) が既存関数と等価', () => {
      expect(factory.tableCellStyle(false)).toEqual(tableCellStyle(false))
    })

    it('imageStyle() が既存関数と等価', () => {
      expect(factory.imageStyle()).toEqual(imageStyle())
    })

    it('footnoteBlockStyle() が既存関数と等価', () => {
      expect(factory.footnoteBlockStyle()).toEqual(footnoteBlockStyle())
    })

    it('defaultSpanStyle() が既存関数と等価', () => {
      expect(factory.defaultSpanStyle()).toEqual(defaultSpanStyle())
    })

    it('inlineCodeSpanStyle() が既存関数と等価', () => {
      expect(factory.inlineCodeSpanStyle()).toEqual(inlineCodeSpanStyle())
    })

    it('linkSpanStyle() が既存関数と等価', () => {
      expect(factory.linkSpanStyle()).toEqual(linkSpanStyle())
    })
  })

  describe('github-dark ファクトリ', () => {
    const factory = createStyleFactory(GITHUB_DARK)

    it('documentStyle の backgroundColor がダークテーマの値', () => {
      expect(factory.documentStyle().backgroundColor).toBe('#0d1117')
    })

    it('documentStyle の color がダークテーマの text 色', () => {
      expect(factory.documentStyle().color).toBe('#e6edf3')
    })

    it('codeBlockStyle の backgroundColor がダークテーマの codeBg', () => {
      expect(factory.codeBlockStyle().backgroundColor).toBe('#161b22')
    })

    it('blockquoteStyle の color がダークテーマの muted 色', () => {
      expect(factory.blockquoteStyle().color).toBe('#8b949e')
    })

    it('linkSpanStyle の color がダークテーマの link 色', () => {
      expect(factory.linkSpanStyle().color).toBe('#58a6ff')
    })

    it('tableCellStyle(true) の backgroundColor がダークテーマの tableHeaderBg', () => {
      expect(factory.tableCellStyle(true).backgroundColor).toBe('#161b22')
    })

    it('headingStyle の fontSize は github-light と同一', () => {
      for (const depth of [1, 2, 3, 4, 5, 6] as HeadingDepth[]) {
        expect(factory.headingStyle(depth).fontSize).toBe(
          createStyleFactory(GITHUB_LIGHT).headingStyle(depth).fontSize,
        )
      }
    })
  })
})
