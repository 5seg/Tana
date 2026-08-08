# 📕 Tana - CMS for minimalist

Tana はシンプルな Headless CMS です。<br>
余計な機能を搭載せず、ただ記事を配信することにのみ特化させています。

## 特徴

- 軽量 - BunがあればOK。`package.json`を見たとき、依存パッケージの少なさに驚くでしょう。
- 余計なものなし - ダッシュボードはありません。記事を編集したいなら、`bun run newArticle.ts foo && vim content/articles/foo.md`を実行してください。
- 使いやすい - シンプルなおかげで、覚えることも圧倒的に少ないです。

## 始め方

### 初期設定

以下の手順に従ってください:

1. このリポジトリをclone
2. `bun i`で依存関係をインストール
3. `bun run init.ts`で初期化

### 起動

`bun run index.ts`で起動します。

### 執筆

`bun run newArticle.ts`を実行すると、`content/articles`以下にMarkdownファイルが生成されます。このとき、引数として名前を指定できます。未指定の場合は自動で命名されます。

例: `bun run newArticle.ts foo` → `content/articles/foo.md`が生成されます。

生成後、お好きなエディタで執筆を行ってください。ファイルの変更は監視されているため、サーバーの再起動は不要です。

## API

### `GET /`

動作確認用。`Tana is working!`を返却します。

### `GET /articles`

記事一覧を返却します。以下のクエリパラメータが使えます:

- `limit` - 最大件数を指定します。デフォルトは`10`です。
- `offset` - オフセットを指定します。デフォルトは`0`です。

`limit`と`offset`の組み合わせにより、ページネーションの実装が可能となります。([例](https://github.com/5seg/website-v2/blob/054e78c9467c5edad71a64dad8a1e2ca60f38b00/src/components/Articles.tsx))

### `GET /articles/:slug`

特定の記事の内容を返却します。

## ライセンス

MIT
