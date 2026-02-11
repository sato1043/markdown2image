import { createHighlighter } from 'shiki'
import type { BundledLanguage, BundledTheme } from 'shiki'
import {
  parseMarkdown,
  LayoutEngine,
  SvgRenderer,
  svgToPng,
  resolveImages,
} from '../lib/markdown2image'
import type { CodeHighlighter } from '../lib/markdown2image'

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

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\`

> 引用ブロックのテスト。
> 複数行の引用も対応している。

---

### リスト

1. 最初の項目
2. 二番目の項目
3. 三番目の項目

テキストに\`インラインコード\`を含めることもできる。**太字**や*斜体*も使える。

### 画像

![サンプル画像](/sample.svg)

### テーブル

| 機能 | 対応状況 | 備考 |
|------|----------|------|
| 見出し | 対応済み | h1-h6 |
| テーブル | 対応済み | GFM形式 |
| 脚注 | 対応済み | GFM形式 |

これは脚注の例[^1]である。もう一つの脚注[^2]も使える。

[^1]: 脚注の内容がここに表示される
[^2]: 二つ目の脚注の内容
`

/** shikiで対応する言語リスト */
const SUPPORTED_LANGS = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'html',
  'css',
  'json',
  'yaml',
  'toml',
  'markdown',
  'bash',
  'shell',
  'sql',
  'ruby',
  'php',
  'swift',
  'kotlin',
] as const

/** Blobをファイルとしてダウンロードする */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function initApp(): Promise<void> {
  const textarea = document.getElementById('markdown-input') as HTMLTextAreaElement
  const preview = document.getElementById('svg-preview') as HTMLDivElement
  const downloadSvgBtn = document.getElementById('download-svg') as HTMLButtonElement
  const downloadPngBtn = document.getElementById('download-png') as HTMLButtonElement

  if (!textarea || !preview || !downloadSvgBtn || !downloadPngBtn) {
    throw new Error('Required DOM elements not found')
  }

  const engine = new LayoutEngine()
  const renderer = new SvgRenderer()
  let currentSvg = ''
  let renderTimer: ReturnType<typeof setTimeout> | null = null

  async function render(): Promise<void> {
    const markdown = textarea.value
    const ast = parseMarkdown(markdown)
    const layout = engine.layout(ast)
    await resolveImages(layout)
    currentSvg = renderer.render(layout)
    preview.innerHTML = currentSvg
  }

  textarea.value = SAMPLE_MARKDOWN

  // 初回レンダリング（ハイライトなし）
  await render()

  // 入力時はデバウンスして非同期レンダリングする
  textarea.addEventListener('input', () => {
    if (renderTimer) clearTimeout(renderTimer)
    renderTimer = setTimeout(() => {
      render()
    }, 200)
  })

  downloadSvgBtn.addEventListener('click', () => {
    if (!currentSvg) return
    const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' })
    downloadBlob(blob, 'document.svg')
  })

  downloadPngBtn.addEventListener('click', async () => {
    if (!currentSvg) return
    downloadPngBtn.disabled = true
    downloadPngBtn.textContent = 'Converting...'
    try {
      const blob = await svgToPng(currentSvg)
      downloadBlob(blob, 'document.png')
    } catch (err) {
      console.error('PNG conversion failed:', err)
    } finally {
      downloadPngBtn.disabled = false
      downloadPngBtn.textContent = 'PNG'
    }
  })

  // shiki Highlighterを非同期で初期化し、CodeHighlighterアダプタ経由で設定する
  const shikiHighlighter = await createHighlighter({
    themes: ['github-light'],
    langs: [...SUPPORTED_LANGS],
  })
  const adapter: CodeHighlighter = {
    getLoadedLanguages: () => shikiHighlighter.getLoadedLanguages(),
    tokenize: (code, lang, theme) =>
      shikiHighlighter.codeToTokensBase(code, {
        lang: lang as BundledLanguage,
        theme: theme as BundledTheme,
      }),
  }
  engine.setHighlighter(adapter)
  await render()
}
