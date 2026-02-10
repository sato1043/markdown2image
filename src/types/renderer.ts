import type { LayoutBox } from './layout'

/** レンダラーの共通インターフェース */
export interface Renderer {
  render(layout: LayoutBox): string | Promise<string>
}
