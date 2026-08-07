import logger from "fivelog";
import fs from "node:fs/promises";
import { join } from "node:path";
import { parseArticle, type Article } from "./articleParser";

export const getArticlesList = async (limit: number, offset: number) => {
  const articlesDir = join(__dirname, "../content/articles");
  const files = (await fs.readdir(articlesDir)).filter((a) =>
    a.endsWith(".md"),
  );
  let articles: (Omit<Article, "body" | "description" | "createdAt"> & {
    createdAt: Date;
  })[] = [];
  for (const file of files) {
    try {
      const parsed = await parseArticle(file);
      articles.push({
        title: parsed.title,
        slug: parsed.slug,
        published: parsed.published,
        createdAt: new Date(parsed.createdAt),
        tags: parsed.tags,
      });
    } catch {}
  }
  return articles.slice(offset, offset + limit);
};

export const getArticle = async (fileName: string) => {
  const articlesDir = join(__dirname, "../content/articles");
  const file = (await fs.readdir(articlesDir)).find(
    (a) => a.slice(0, -3) === fileName,
  );
  return file ? await parseArticle(file) : null;
};
