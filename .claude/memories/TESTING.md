# テスト設計ドキュメント

## 概要

`src/lib/markdown2image/` コア変換ライブラリのユニットテスト。
Jest + ts-jest を使用し、Node.js 環境で実行する。

## 実行方法

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付き実行
npx jest --coverage

# 個別テスト実行
npx jest -- src/lib/markdown2image/__tests__/parser.test.ts
```

## テスト環境

| 項目 | 内容 |
|------|------|
| フレームワーク | Jest 30.x |
| TypeScript変換 | ts-jest 29.x |
| テスト環境 | `node`（jsdom不使用） |
| ブラウザAPI | Canvas 2D API は共有モックで代替 |
| 設定ファイル | `jest.config.ts` |

### testEnvironment に node を採用した理由

jsdom は `canvas.getContext('2d')` を返せないため不採用とした。
Canvas 2D API は `__tests__/__mocks__/canvas.ts` の共有モックで代替する。

### ts-jest の tsconfig オーバーライド

`package.json` の `"type": "module"` との衝突を回避するため、
`jest.config.ts` 内で `module: 'CommonJS'` を強制している。

## テストファイル構成

```
src/lib/markdown2image/
  __tests__/
    __mocks__/
      canvas.ts                 # Canvas 2D API 共有モック
    parser.test.ts              # parseMarkdown           (17テスト)
    style.test.ts               # スタイル定数・関数       (34テスト)
    measure.test.ts             # TextMeasurer            (11テスト)
    engine.test.ts              # LayoutEngine            (49テスト)
    svg-renderer.test.ts        # SvgRenderer             (18テスト)
    image-resolver.test.ts      # fetchAsDataUri 等       (9テスト)
```

合計: 6スイート / 144テスト

### テスト対象外

- `renderer/png.ts` — ブラウザAPI全面依存（Blob, Image, Canvas, URL）のためテスト対象外

## 各テストファイルの概要

### parser.test.ts

- **対象**: `parseMarkdown()` 関数
- **モック**: 不要（unified@9等はCJSパッケージ）
- **検証内容**: 各Markdownブロック要素・インライン要素のmdast AST変換、GFM拡張（テーブル・タスクリスト・取り消し線）、脚注（linkReference/definition）、空文字列、日本語

### style.test.ts

- **対象**: `DOCUMENT_WIDTH`, `CONTENT_WIDTH` 等の定数、各スタイルファクトリ関数
- **モック**: 不要
- **検証内容**: 定数値、各関数の返り値プロパティ、h1〜h6のfontSize差異

### measure.test.ts

- **対象**: `TextMeasurer` クラス
- **モック**: Canvas 2D API（`__mocks__/canvas.ts`）— `measureText` は `text.length * 8` の固定幅を返す
- **検証内容**: `measureWidth`, `lineHeight`, `wrapSpans`（折り返しロジック、CJK分割、行頭空白除去）

### engine.test.ts

- **対象**: `LayoutEngine` クラス
- **モック**: Canvas 2D API（measure.test.ts と同じ共有モック）
- **検証内容**: document構造、heading/paragraph/code-block/blockquote/list/table/hr/image/footnote の各レイアウト、インラインスタイル反映、CodeHighlighter統合（ハイライター有無・未ロード言語のフォールバック）、垂直配置計算

### svg-renderer.test.ts

- **対象**: `SvgRenderer` クラス
- **モック**: 不要（LayoutBoxを手動構築して入力）
- **検証内容**: SVGルートタグ、背景矩形、テキスト描画（bold/italic/link下線/取り消し線/インラインコード背景）、コードブロック、引用、リスト、テーブル、画像（src有無でのフォールバック）、水平線、脚注、XMLエスケープ

### image-resolver.test.ts

- **対象**: `fetchAsDataUri`, `resolveImages`, `clearImageCache`
- **モック**: `global.fetch`, `global.FileReader`
- **検証内容**: URL→data URI変換、キャッシュ動作（再fetchしないこと）、fetch失敗時フォールバック（元URLを返す）、response.ok=false時の挙動、再帰的画像解決、data:スキーム既存時のスキップ、キャッシュクリア後の再fetch

## Canvas共有モック

`__tests__/__mocks__/canvas.ts` が提供する主な機能:

- `setupCanvasMock()` — `globalThis.document` に Canvas モックを注入する。テストの `beforeAll` で呼び出す
- `teardownCanvasMock()` — モックをクリーンアップする。テストの `afterAll` で呼び出す
- `measureText` は `text.length * 8` px の固定幅を返す

テスト内でテキスト幅に基づく計算を行う場合、この固定幅を前提として期待値を設定する。

## カバレッジ

| ファイル | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| 全体 | 96.81% | 76.77% | 98.76% | 97.68% |
| image-resolver.ts | 100% | 100% | 100% | 100% |
| style.ts | 100% | 100% | 100% | 100% |
| markdown.ts | 100% | 100% | 100% | 100% |
| engine.ts | 96.75% | 78.75% | 96.87% | 96.55% |
| measure.ts | 92.75% | 77.08% | 100% | 95.45% |
| svg.ts | 96.99% | 70.83% | 100% | 99.2% |

### カバーされていない主な箇所

- `engine.ts:116` — `layoutBlock` の default ケース（未対応ノードタイプ）
- `engine.ts:401,421` — テーブルの空行やカラム数不足のエッジケース
- `engine.ts:652,658-665` — `footnoteReference` ノードや未対応インライン要素の default ケース
- `measure.ts:11` — Canvas 2D context 取得失敗のエラーパス
- `svg.ts:50` — `renderBox` の default ケース（未対応ボックスタイプ）

## テスト追加のガイドライン

### 新しいブロック要素を追加する場合

1. `parser.test.ts` にmdast AST変換のテストを追加する
2. `engine.test.ts` にレイアウト計算のテストを追加する
3. `svg-renderer.test.ts` にSVG出力のテストを追加する

### 新しいインライン要素を追加する場合

1. `parser.test.ts` にパーステストを追加する
2. `engine.test.ts` の「インラインスタイル」セクションにspan検証を追加する
3. `svg-renderer.test.ts` に描画テストを追加する

### Canvas依存の新モジュールを追加する場合

- `setupCanvasMock()` / `teardownCanvasMock()` を `beforeAll` / `afterAll` で呼び出す
- `measureText` の固定幅（`text.length * 8`）を前提としてテストを設計する
