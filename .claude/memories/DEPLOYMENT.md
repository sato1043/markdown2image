# デプロイ設計ドキュメント

## 概要

GitHub Actions でビルドし、GitHub Pages へ配信する。
ビルド成果物はリポジトリに入れず、Actions の artifact として受け渡す。

公開 URL: https://sato1043.github.io/markdown2image/

## 構成

```
develop への push
    │
    ▼
[build job]
    │  actions/checkout      → ソース取得
    │  actions/setup-node    → .node-version から Node を解決 + npm キャッシュ
    │  npm ci                → ロックファイル厳密インストール
    │  npm test              → 落ちた成果物を配信しないための歯止め
    │  npm run build         → tsc && vite build → dist/
    │  actions/configure-pages
    │  actions/upload-pages-artifact → dist/ を artifact 化
    ▼
[deploy job]
    │  actions/deploy-pages  → Pages へ公開
    ▼
https://sato1043.github.io/markdown2image/
```

設定ファイル: `.github/workflows/deploy-pages.yml`

## base path

GitHub Pages の project site は `https://<user>.github.io/<repo>/` 配下に置かれる。
`vite.config.ts` の `base` にリポジトリ名を固定する。

```ts
base: '/markdown2image/',
```

### 固定値にした理由

環境で分岐させず dev / build / preview のすべてで同じ値を使う。
ローカルの `npm run preview` が本番と同じ経路を再現でき、
ローカルビルドと CI ビルドの成果物が一致する。
代償は dev サーバの URL が `localhost:5173/markdown2image/` になる点のみ。

### 文字列リテラル内の絶対パスに注意する

Vite が書き換えるのは HTML の属性と import の解決先だけである。
コード中の文字列リテラルは対象外なので、`base` を設定しても直らない。

`src/ui/app.ts` のサンプル Markdown が `/sample.svg` を指しており、
project site では `https://sato1043.github.io/sample.svg` を取りに行って 404 になっていた。
`import.meta.env.BASE_URL` を通す形へ直してある。

```ts
![サンプル画像](${import.meta.env.BASE_URL}sample.svg)
```

`import.meta.env` の型は `src/vite-env.d.ts` の
`/// <reference types="vite/client" />` で通す。これが無いと `tsc` が落ちる。

## Node バージョン

`.node-version` を単一の定義とし、ローカルの fnm と CI の `setup-node` が同じファイルを読む。

| 場所 | 読み方 |
|------|--------|
| ローカル | fnm が `.node-version` を読む（`fnm env --use-on-cd` 設定時は cd で自動切替） |
| CI | `actions/setup-node` の `node-version-file: .node-version` |

内容はメジャーのみの `24`。パッチ更新に追随する。

### Node 24 を選んだ根拠

`nodejs/Release` の `schedule.json`（一次情報）による。

| 系列 | 状態 | EOL |
|------|------|-----|
| Node 20 | **EOL 済み** | 2026-04-30 |
| Node 22 | Maintenance | 2027-04-30 |
| Node 24 | **Active LTS** | 2028-04-30 |

## 使用している action

公式 starter workflow と各 action の README は版が古いまま止まっているため、
実際の最新メジャーを採った。

| action | 版 |
|--------|-----|
| actions/checkout | v7 |
| actions/setup-node | v7 |
| actions/configure-pages | v6 |
| actions/upload-pages-artifact | v5 |
| actions/deploy-pages | v5 |

## 初回セットアップ

リポジトリ設定で Pages のソースを切り替える。1 度だけ必要である。

```
Settings → Pages → Build and deployment → Source → GitHub Actions
```

CLI なら次の 1 行でも同じ。

```bash
gh api -X POST repos/sato1043/markdown2image/pages -f build_type=workflow
```

設定の確認。

```bash
gh api repos/sato1043/markdown2image/pages
```

## 権限

既定を `contents: read` に置き、書き込み権限は deploy job だけに与える。

```yaml
permissions:
  contents: read      # workflow 既定

jobs:
  deploy:
    permissions:
      pages: write    # Pages へのデプロイ
      id-token: write # デプロイ元の検証（OIDC）
```

## 検証記録（2026-09-06 初回デプロイ）

| 項目 | 結果 |
|------|------|
| CI のテスト | 9 スイート / 210 テスト通過 |
| CI の Node | `v24.20.0`（`.node-version` の `24` が解決された） |
| 本番 URL | `/markdown2image/` → 200 |
| 画像 | `/markdown2image/sample.svg` → 200 |
| 修正前のパス | `/sample.svg` → 404（修正が実在の欠陥を塞いだことの対照） |
| ブラウザ | プレビュー描画・ハイライト・画像・テーブル・脚注を確認。コンソールエラー 0 件 |
| SVG ダウンロード | 実ファイルの生成を確認 |
| PNG ダウンロード | エラーなく完了 |

## 既知の制約

| 項目 | 内容 |
|------|------|
| PR で CI が走らない | トリガーは `push: branches: [develop]` のみ。テスト専用の workflow は未整備 |
| dist のサイズ | 9.8MB / 300 ファイル。shiki が全バンドル言語を含む。初回ロードは `index-*.js` 270KB（gzip 85KB）のみで、言語チャンクは動的 import される |
| ビルド時の依存の脆弱性 | `npm audit` が 12 件を報告する（`vite` 経由の esbuild / rollup、`ts-jest` 経由の handlebars）。いずれも dev / build 時のみで配信物には含まれない |

## 関連する落とし穴

### ts-node が devDependencies に要る

`jest.config.ts` が TypeScript のため、Jest が設定を読むのに `ts-node` を要する。
これを欠くと `npm ci` した環境でテストが 1 件も走らない
（`npm install` では他パッケージ経由で入ることがあり、気づきにくい）。
