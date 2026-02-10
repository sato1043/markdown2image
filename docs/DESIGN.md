# markdown2image 設計ドキュメント

## 1. 要件定義

| 項目 | 内容 |
|------|------|
| 目的 | Markdownドキュメントを画像に変換する |
| 対象ユーザー | Markdownでドキュメントを書く開発者・技術者 |
| 実行環境 | ブラウザ完結型ウェブアプリ（サーバー不要） |
| 出力形式 | SVG（主）、PNG（フォールバック） |
| レンダリング方式 | Canvas APIでテキスト計測、SVG DOM構築で出力 |
| Markdown対応範囲 | GFMフル対応（テーブル・タスクリスト・注釈含む） |
| スタイル | 固定スタイル（カスタマイズ不要） |
| 技術スタック | Vite + TypeScript（UIフレームワークなし） |

### 1.1 成功の判定基準

- Markdownテキストを入力するとSVGプレビューがリアルタイム表示される
- SVGファイルとしてダウンロードできる
- PNGファイルとしてダウンロードできる
- 日本語テキストが正しく表示される
- GFMの主要要素（見出し・段落・リスト・コードブロック・テーブル・引用・画像・注釈）が描画される

## 2. アーキテクチャ

### 2.1 全体構成

```
[入力] Markdownテキスト（テキストエリア）
    │
    ▼
[パーサー層] unified + remark-parse + remark-gfm + remark-footnotes
    │         → mdast (Markdown AST)
    ▼
[レイアウト層] LayoutEngine
    │  ・mdast ASTを走査
    │  ・各ノードをLayoutBox（位置・サイズ・スタイル情報）に変換
    │  ・テキスト折り返し: 非表示Canvasの measureText() で文字幅計測
    │  ・ブロック要素の垂直配置計算
    │  ・テーブルの列幅自動計算
    │  → LayoutTree（描画可能なレイアウトツリー）
    ▼
[レンダラー層] 共通インターフェース Renderer
    ├── SvgRenderer: LayoutTree → SVG文字列
    │     <text>, <rect>, <line>, <image> 等のSVG要素を生成
    └── CanvasRenderer: LayoutTree → PNG (Canvas 2D API → toDataURL)
    │
    ▼
[出力] SVGファイルダウンロード / PNGファイルダウンロード
```

### 2.2 ディレクトリ構造

```
src/
  types/
    layout.ts       # LayoutBox, TextSpan, BoxStyle等の型定義
    renderer.ts     # Renderer インターフェース
  parser/
    markdown.ts     # Markdown → mdast パース
  layout/
    engine.ts       # レイアウトエンジン本体
    measure.ts      # テキスト計測（Canvas measureText）
    style.ts        # 固定スタイル定義
  renderer/
    svg.ts          # SVGレンダラー
    canvas.ts       # Canvasレンダラー（Phase 5）
  ui/
    app.ts          # UIロジック
  main.ts           # エントリポイント
index.html          # HTML
```

### 2.3 データフロー

1. ユーザーがテキストエリアにMarkdownを入力する
2. パーサーがMarkdownをmdast ASTに変換する
3. レイアウトエンジンがASTを走査しLayoutBoxツリーを生成する
4. レンダラーがLayoutBoxツリーからSVG文字列を生成する
5. UIがSVGをプレビュー表示する
6. ユーザーがダウンロードボタンでSVG/PNGを保存する

## 3. ドメインモデル

### 3.1 レイアウトツリー

```typescript
// レイアウトボックス: 描画可能な配置情報を持つノード
type LayoutBox = {
  type: LayoutBoxType
  x: number
  y: number
  width: number
  height: number
  style: BoxStyle
  children: LayoutBox[]
  content?: TextSpan[]   // インライン要素の場合
  lines?: TextLine[]     // テキスト折り返し後の行情報
}

type LayoutBoxType =
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
```

### 3.2 テキスト表現

```typescript
// インラインテキストの断片
type TextSpan = {
  text: string
  style: SpanStyle
}

type SpanStyle = {
  bold: boolean
  italic: boolean
  code: boolean
  link?: string
  strikethrough: boolean
  color: string
  fontFamily: string
  fontSize: number
}

// 折り返し済みの行
type TextLine = {
  spans: TextSpan[]
  width: number
  height: number
}
```

### 3.3 スタイル

```typescript
type BoxStyle = {
  fontFamily: string
  fontSize: number
  lineHeight: number
  color: string
  backgroundColor?: string
  borderColor?: string
  padding: Spacing
  margin: Spacing
}

type Spacing = {
  top: number
  right: number
  bottom: number
  left: number
}
```

### 3.4 レンダラーインターフェース

```typescript
interface Renderer {
  render(layout: LayoutBox): string | Promise<string>
}
```

## 4. 技術スタック

| 用途 | ライブラリ | バージョン方針 |
|------|-----------|---------------|
| Markdownパース | unified + remark-parse | 最新安定版 |
| GFM拡張 | remark-gfm | 最新安定版 |
| 注釈 | remark-footnotes | 最新安定版 |
| ビルド | Vite | 最新安定版 |
| 言語 | TypeScript | 5.x |
| シンタックスハイライト | shiki（Phase 3で導入） | 最新安定版 |

## 5. 段階的実装計画

### Phase 1: 最小動作版

- プロジェクトセットアップ（Vite + TS）
- Markdownパーサー導入
- レイアウトエンジンの基本（見出し・段落・テキスト折り返し）
- SVGレンダラーの基本
- 最小限のUI（テキストエリア + プレビュー + ダウンロードボタン）

### Phase 2: インライン要素

- 太字・斜体・インラインコード・リンクの描画
- 取り消し線の描画
- 混在フォントでのテキスト計測

### Phase 3: ブロック要素

- コードブロック（shikiによるシンタックスハイライト含む）
- 引用ブロック
- リスト（ul/ol/タスクリスト）
- 水平線

### Phase 4: 高度な要素

- テーブル（列幅自動計算）
- 画像埋め込み
- 注釈（脚注）

### Phase 5: PNG出力・仕上げ

- Canvasレンダラー実装
- PNG出力対応
- UIの仕上げ

## 6. リスク・懸念点

| リスク | 影響度 | 対策 |
|--------|--------|------|
| テキスト折り返しの精度 | 中 | measureText()はフォントロード状態に依存する。WebFont使用時はフォントロード完了を待つ |
| SVGでの画像埋め込み | 中 | 外部URLの画像はCORS制約を受ける。Base64埋め込みで対応する |
| テーブルの列幅計算 | 高 | 内容に応じた列幅配分アルゴリズムが必要。Phase 4で対応する |
| 実装量 | 高 | フル対応のレイアウトエンジンは大規模。Phase分けで段階的に品質を上げる |
| 日本語の禁則処理 | 中 | 行頭・行末の禁則文字処理が必要。Phase 1では基本的な折り返しのみとし段階的に改善する |
