import type { Theme, ThemePreset, ThemeConfig, DeepPartial } from '../types/theme'
import { GITHUB_LIGHT } from './presets/github-light'
import { GITHUB_DARK } from './presets/github-dark'

/** プリセット名からテーマオブジェクトを取得する */
const PRESETS: Record<ThemePreset, Theme> = {
  'github-light': GITHUB_LIGHT,
  'github-dark': GITHUB_DARK,
}

/** 2つのオブジェクトを再帰的にマージする（source が target を上書きする） */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: DeepPartial<T>,
): T {
  const result = { ...target }

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key]
    if (sourceValue === undefined) continue

    const targetValue = target[key]
    if (
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue) &&
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as DeepPartial<Record<string, unknown>>,
      ) as T[keyof T]
    } else {
      result[key] = sourceValue as T[keyof T]
    }
  }

  return result
}

/**
 * テーマ設定を解決し、完全な Theme オブジェクトを返す
 *
 * - 引数なし / undefined → github-light
 * - プリセット名（文字列） → 対応するプリセット
 * - ThemeConfig オブジェクト → base プリセット + 部分上書き
 */
export function resolveTheme(
  config?: ThemePreset | ThemeConfig,
): Theme {
  if (config === undefined) {
    return GITHUB_LIGHT
  }

  if (typeof config === 'string') {
    const preset = PRESETS[config]
    if (!preset) {
      throw new Error(`Unknown theme preset: ${config}`)
    }
    return preset
  }

  const base = config.base ? PRESETS[config.base] : GITHUB_LIGHT
  if (!base) {
    throw new Error(`Unknown theme preset: ${config.base}`)
  }

  // base プロパティを除いた部分上書きでマージする
  const { base: _base, ...overrides } = config
  return deepMerge(base, overrides as DeepPartial<Theme>)
}
