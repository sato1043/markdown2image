// CJS対応: unified@9, remark-parse@9, remark-gfm@1
import unified from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { Root } from 'mdast'

// unified v9 と remark-gfm v1 の型定義は
// エコシステムのメジャーバージョン差によりシグネチャが一致しない。
// ランタイムでは正しく動作するため any でバイパスする。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processor = (unified() as any)
  .use(remarkParse)
  .use(remarkGfm)

/** Markdownテキストをmdast ASTに変換する */
export function parseMarkdown(markdown: string): Root {
  return processor.parse(markdown) as Root
}
