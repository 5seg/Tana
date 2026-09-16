import { Hono } from "hono";
import type { Env, Article, ArticleRow } from "./types";

const app = new Hono<{ Bindings: Env }>();

// Row -> Article 変換
const formatArticle = (row: ArticleRow): Article => ({
  slug: row.slug,
  title: row.title,
  description: row.description,
  body: row.body,
  published: Boolean(row.published),
  tags: JSON.parse(row.tags || "[]"),
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? undefined,
});

// KVキャッシュの全削除（更新時に一括クリア）
const clearCache = async (kv: KVNamespace) => {
  const list = await kv.list();
  await Promise.all(list.keys.map((k) => kv.delete(k.name)));
};

// --- Public Endpoints ---

app.get("/", (c) => c.text("Tana is working!"));

// 記事一覧
app.get("/articles", async (c) => {
  const limit = Math.max(1, Number(c.req.query("limit") ?? 10));
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0));
  const cacheKey = `articles:list:${limit}:${offset}`;

  const cached = await c.env.KV.get(cacheKey, "json");
  if (cached) return c.json(cached);

  const { results: rows } = await c.env.DB.prepare(
    "SELECT slug, title, description, published, tags, created_at, updated_at FROM articles WHERE published = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?"
  )
    .bind(limit, offset)
    .all<ArticleRow>();

  const countRes = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM articles WHERE published = 1"
  ).first<{ count: number }>();

  const data = rows.map((r) => {
    const a = formatArticle(r);
    return {
      title: a.title,
      slug: a.slug,
      description: a.description,
      tags: a.tags,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  });

  const response = {
    data,
    meta: { total: countRes?.count ?? 0 },
  };

  await c.env.KV.put(cacheKey, JSON.stringify(response));
  return c.json(response);
});

// 記事詳細
app.get("/articles/:slug", async (c) => {
  const slug = c.req.param("slug");
  const cacheKey = `article:${slug}`;

  const cached = await c.env.KV.get(cacheKey, "json");
  if (cached) return c.json(cached);

  const row = await c.env.DB.prepare(
    "SELECT * FROM articles WHERE slug = ? AND published = 1"
  )
    .bind(slug)
    .first<ArticleRow>();

  if (!row) return c.json({ error: "Article Not Found" }, 404);

  const article = formatArticle(row);
  await c.env.KV.put(cacheKey, JSON.stringify(article));
  return c.json(article);
});

// --- Admin Endpoints (Bearer Auth) ---

app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || token !== c.env.API_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

// 記事作成
app.post("/api/articles", async (c) => {
  const body = await c.req.json<Partial<Article>>();
  if (!body.slug || !body.title || body.body === undefined) {
    return c.json({ error: "Missing required fields (slug, title, body)" }, 400);
  }

  const now = new Date().toISOString();
  try {
    await c.env.DB.prepare(
      `INSERT INTO articles (slug, title, description, body, published, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.slug,
        body.title,
        body.description ?? "",
        body.body,
        body.published ? 1 : 0,
        JSON.stringify(body.tags ?? []),
        body.createdAt ?? now,
        now
      )
      .run();

    await clearCache(c.env.KV);
    return c.json({ ok: true, slug: body.slug }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

// 記事更新
app.put("/api/articles/:slug", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json<Partial<Article>>();

  const existing = await c.env.DB.prepare("SELECT * FROM articles WHERE slug = ?")
    .bind(slug)
    .first<ArticleRow>();
  if (!existing) return c.json({ error: "Article Not Found" }, 404);

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE articles SET 
      title = ?, description = ?, body = ?, published = ?, tags = ?, updated_at = ?
     WHERE slug = ?`
  )
    .bind(
      body.title ?? existing.title,
      body.description ?? existing.description,
      body.body ?? existing.body,
      body.published !== undefined ? (body.published ? 1 : 0) : existing.published,
      body.tags ? JSON.stringify(body.tags) : existing.tags,
      now,
      slug
    )
    .run();

  await clearCache(c.env.KV);
  return c.json({ ok: true, slug });
});

// 記事削除
app.delete("/api/articles/:slug", async (c) => {
  const slug = c.req.param("slug");
  const res = await c.env.DB.prepare("DELETE FROM articles WHERE slug = ?")
    .bind(slug)
    .run();

  if (res.meta.changes === 0) {
    return c.json({ error: "Article Not Found" }, 404);
  }

  await clearCache(c.env.KV);
  return c.json({ ok: true });
});

export default app;
