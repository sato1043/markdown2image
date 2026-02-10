/** 上下左右の余白 */
export type Spacing = {
  top: number
  right: number
  bottom: number
  left: number
}

/** ブロック要素のスタイル */
export type BoxStyle = {
  fontFamily: string
  fontSize: number
  lineHeight: number
  color: string
  backgroundColor?: string
  borderColor?: string
  padding: Spacing
  margin: Spacing
}

/** インラインテキスト断片のスタイル */
export type SpanStyle = {
  bold: boolean
  italic: boolean
  code: boolean
  strikethrough: boolean
  link?: string
  color: string
  fontFamily: string
  fontSize: number
}

/** インラインテキストの断片 */
export type TextSpan = {
  text: string
  style: SpanStyle
}

/** 折り返し済みの1行 */
export type TextLine = {
  spans: TextSpan[]
  width: number
  height: number
}

/** レイアウトボックスの種別 */
export type LayoutBoxType =
  | 'document'
  | 'heading'
  | 'paragraph'
  | 'code-block'
  | 'blockquote'
  | 'list'
  | 'list-item'
  | 'table'
  | 'table-row'
  | 'table-cell'
  | 'image'
  | 'hr'
  | 'footnote'

/** 見出しレベル (1-6) */
export type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6

/** 描画可能な配置情報を持つノード */
export type LayoutBox = {
  type: LayoutBoxType
  x: number
  y: number
  width: number
  height: number
  style: BoxStyle
  children: LayoutBox[]
  lines?: TextLine[]
  /** 見出しレベル (headingの場合) */
  depth?: HeadingDepth
  /** リストマーカー (list-itemの場合) */
  marker?: string
  /** 画像URL (imageの場合) */
  src?: string
  /** 画像alt (imageの場合) */
  alt?: string
  /** コードブロックの言語 (code-blockの場合) */
  language?: string
  /** コードブロックの生テキスト (code-blockの場合) */
  code?: string
}
