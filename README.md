# 📕 Tana - CMS for minimalist

Tana はシンプルな Headless CMS です。<br>
余計な機能を搭載せず、ただ記事を配信することにのみ特化させています。

## 特徴

- 軽量 - BunがあればOK。`package.json`を見たとき、依存パッケージの少なさに驚くでしょう。
- 余計なものなし - ダッシュボードはありません。記事を編集したいなら、`bun run newArticle.ts foo && vim content/articles/foo.md`を実行してください。
- 使いやすい - シンプルなおかげで、覚えることも圧倒的に少ないです。

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
