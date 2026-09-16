# 📕 Tana v2 - CMS for minimalist (Cloudflare Workers + D1 + KV)

Tana はミニマリスト向けの超軽量 Headless CMS です。
v2 では Cloudflare Workers + D1 + KV のエッジスタックに移行し、シンプルさを極限まで維持したまま高速・グローバル配信に対応しました。

## 特徴

- **超軽量・ミニマル**: Hono ベースで構成。ファイルもコードも数個のみ。
- **D1 + KV アーキテクチャ**: D1 を記事・メタデータの保管庫、KV を一覧・個別記事の高速キャッシュ層として利用。
- **シンプルなキャッシュ管理**: 記事の作成・更新・削除時に KV キャッシュを自動パージ。
- **Bearer 認証付き CRUD API**: 余計なダッシュボードを作らず、シンプルな REST API で記事を管理。

## 構成

- `src/index.ts`: Hono エントリーポイント & API エンドポイント
- `src/types.ts`: 型定義 (Article, D1Row, Bindings)
- `schema.sql`: D1 データベーススキーマ
- `wrangler.jsonc`: Cloudflare 設定 (D1/KV バインディング)

## API

### 閲覧用 API (Public / KV Cache)
- `GET /`: ヘルスチェック (`Tana is working!`)
- `GET /articles?limit=10&offset=0`: 公開記事一覧
- `GET /articles/:slug`: 記事詳細

### 管理用 API (`Authorization: Bearer <API_TOKEN>`)
- `POST /api/articles`: 記事作成
- `PUT /api/articles/:slug`: 記事更新
- `DELETE /api/articles/:slug`: 記事削除

## 始め方

### 1. D1 データベース初期化
```bash
# ローカル
bun run d1:init:local

# リモート (Cloudflare)
bun run d1:init:remote
```

### 2. 起動 / デプロイ
```bash
# 開発サーバー
bun run dev

# Cloudflare Workers へデプロイ
bun run deploy
```

## ライセンス

MIT
