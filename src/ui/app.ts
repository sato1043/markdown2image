import { parseMarkdown } from '../parser/markdown'
import { LayoutEngine } from '../layout/engine'
import { SvgRenderer } from '../renderer/svg'

const SAMPLE_MARKDOWN = `# markdown2image

Markdownドキュメントを画像に変換するウェブアプリ。

## 特徴

- **SVG出力**に対応している
- 日本語テキストを正しく表示する
- ブラウザだけで動作する

## コード例

\`\`\`typescript
function hello(): string {
  return "Hello, World!"
}
\`\`\`

> 引用ブロックのテスト。
> 複数行の引用も対応している。

---

### リスト

1. 最初の項目
2. 二番目の項目
3. 三番目の項目

テキストに\`インラインコード\`を含めることもできる。**太字**や*斜体*も使える。
`

export function initApp(): void {
  const textarea = document.getElementById('markdown-input') as HTMLTextAreaElement
  const preview = document.getElementById('svg-preview') as HTMLDivElement
  const downloadSvgBtn = document.getElementById('download-svg') as HTMLButtonElement

  if (!textarea || !preview || !downloadSvgBtn) {
    throw new Error('Required DOM elements not found')
  }

  const engine = new LayoutEngine()
  const renderer = new SvgRenderer()
  let currentSvg = ''

  function render(): void {
    const markdown = textarea.value
    const ast = parseMarkdown(markdown)
    const layout = engine.layout(ast)
    currentSvg = renderer.render(layout)
    preview.innerHTML = currentSvg
  }

  textarea.value = SAMPLE_MARKDOWN
  render()

  textarea.addEventListener('input', render)

  downloadSvgBtn.addEventListener('click', () => {
    if (!currentSvg) return
    const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.svg'
    a.click()
    URL.revokeObjectURL(url)
  })
}
