import { resolveTheme, deepMerge } from '../theme/resolve'
import { GITHUB_LIGHT } from '../theme/presets/github-light'
import { GITHUB_DARK } from '../theme/presets/github-dark'
import type { Theme, ThemeConfig } from '../types/theme'

describe('deepMerge', () => {
  it('ネストされたオブジェクトを再帰的にマージする', () => {
    const target = { a: { b: 1, c: 2 }, d: 3 }
    const source = { a: { b: 10 } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: { b: 10, c: 2 }, d: 3 })
  })

  it('元のオブジェクトを変更しない', () => {
    const target = { a: { b: 1 } }
    const source = { a: { b: 2 } }
    deepMerge(target, source)
    expect(target.a.b).toBe(1)
  })

  it('undefined の値はスキップする', () => {
    const target = { a: 1, b: 2 }
    const source = { a: undefined, b: 3 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 3 })
  })

  it('プリミティブ値を上書きする', () => {
    const target = { a: 'hello', b: 42 }
    const source = { a: 'world' }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 'world', b: 42 })
  })

  it('深くネストされたオブジェクトをマージする', () => {
    const target = { a: { b: { c: { d: 1 } } } }
    const source = { a: { b: { c: { d: 99 } } } }
    const result = deepMerge(target, source)
    expect(result.a.b.c.d).toBe(99)
  })
})

describe('resolveTheme', () => {
  it('引数なしで github-light を返す', () => {
    const theme = resolveTheme()
    expect(theme).toEqual(GITHUB_LIGHT)
  })

  it('undefined で github-light を返す', () => {
    const theme = resolveTheme(undefined)
    expect(theme).toEqual(GITHUB_LIGHT)
  })

  it('"github-light" プリセット名で github-light を返す', () => {
    const theme = resolveTheme('github-light')
    expect(theme).toEqual(GITHUB_LIGHT)
  })

  it('"github-dark" プリセット名で github-dark を返す', () => {
    const theme = resolveTheme('github-dark')
    expect(theme).toEqual(GITHUB_DARK)
  })

  it('不明なプリセット名でエラーを投げる', () => {
    expect(() => resolveTheme('unknown' as never)).toThrow('Unknown theme preset')
  })

  it('base 指定なしの ThemeConfig は github-light をベースにする', () => {
    const config: ThemeConfig = { color: { text: '#ff0000' } }
    const theme = resolveTheme(config)
    expect(theme.color.text).toBe('#ff0000')
    expect(theme.color.link).toBe(GITHUB_LIGHT.color.link)
  })

  it('base 指定ありの ThemeConfig はそのプリセットをベースにする', () => {
    const config: ThemeConfig = {
      base: 'github-dark',
      color: { link: '#ff6600' },
    }
    const theme = resolveTheme(config)
    expect(theme.color.link).toBe('#ff6600')
    expect(theme.color.text).toBe(GITHUB_DARK.color.text)
    expect(theme.document.backgroundColor).toBe(GITHUB_DARK.document.backgroundColor)
  })

  it('部分上書きで document.width を変更できる', () => {
    const config: ThemeConfig = { document: { width: 1024 } }
    const theme = resolveTheme(config)
    expect(theme.document.width).toBe(1024)
    expect(theme.document.padding).toEqual(GITHUB_LIGHT.document.padding)
  })

  it('部分上書きで heading.sizes の一部を変更できる', () => {
    const config: ThemeConfig = { heading: { sizes: { 1: 40 } } }
    const theme = resolveTheme(config)
    expect(theme.heading.sizes[1]).toBe(40)
    expect(theme.heading.sizes[2]).toBe(GITHUB_LIGHT.heading.sizes[2])
  })

  it('部分上書きで spacing の一部を変更できる', () => {
    const config: ThemeConfig = { spacing: { blockMarginBottom: 24 } }
    const theme = resolveTheme(config)
    expect(theme.spacing.blockMarginBottom).toBe(24)
    expect(theme.spacing.listPaddingLeft).toBe(GITHUB_LIGHT.spacing.listPaddingLeft)
  })

  it('元のプリセットオブジェクトを変更しない', () => {
    const originalText = GITHUB_LIGHT.color.text
    resolveTheme({ color: { text: '#999999' } })
    expect(GITHUB_LIGHT.color.text).toBe(originalText)
  })
})

describe('GITHUB_LIGHT プリセット', () => {
  it('document.width が 800 である', () => {
    expect(GITHUB_LIGHT.document.width).toBe(800)
  })

  it('document.backgroundColor が #ffffff である', () => {
    expect(GITHUB_LIGHT.document.backgroundColor).toBe('#ffffff')
  })

  it('color.text が #1a1a1a である', () => {
    expect(GITHUB_LIGHT.color.text).toBe('#1a1a1a')
  })

  it('syntaxTheme が github-light である', () => {
    expect(GITHUB_LIGHT.syntaxTheme).toBe('github-light')
  })
})

describe('GITHUB_DARK プリセット', () => {
  it('document.backgroundColor が #0d1117 である', () => {
    expect(GITHUB_DARK.document.backgroundColor).toBe('#0d1117')
  })

  it('color.text が #e6edf3 である', () => {
    expect(GITHUB_DARK.color.text).toBe('#e6edf3')
  })

  it('color.link が #58a6ff である', () => {
    expect(GITHUB_DARK.color.link).toBe('#58a6ff')
  })

  it('syntaxTheme が github-dark である', () => {
    expect(GITHUB_DARK.syntaxTheme).toBe('github-dark')
  })

  it('heading.sizes は github-light と同一である', () => {
    expect(GITHUB_DARK.heading.sizes).toEqual(GITHUB_LIGHT.heading.sizes)
  })

  it('spacing は github-light と同一である', () => {
    expect(GITHUB_DARK.spacing).toEqual(GITHUB_LIGHT.spacing)
  })
})
