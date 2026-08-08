import logger from "fivelog";
import fs from "node:fs/promises";
import { join } from "node:path";
import { parseArticle, type Article } from "./articleParser";

export const getArticlesList = async (limit: number, offset: number) => {
  const articlesDir = join(__dirname, "../content/articles");
  const files = (await fs.readdir(articlesDir)).filter((a) =>
    a.endsWith(".md"),
  );
  let articles: (Omit<
    Article,
    "body" | "description" | "createdAt" | "updatedAt" | "published"
  > & {
    createdAt: Date;
    updatedAt?: Date;
  })[] = [];
  for (const file of files) {
    try {
      const parsed = await parseArticle(file);
      if (parsed.published) {
        articles.push({
          title: parsed.title,
          slug: parsed.slug,
          createdAt: new Date(parsed.createdAt),
          updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : undefined,
          tags: parsed.tags,
        });
      }
    } catch (e) {
      logger.error(e);
    }
  }
  articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const len = articles.length;
  const sliced = articles.slice(offset, offset + limit);
  return {
    data: sliced,
    meta: {
      total: len,
    },
  };
};

export const getArticle = async (fileName: string) => {
  const articlesDir = join(__dirname, "../content/articles");
  const file = (await fs.readdir(articlesDir)).find(
    (a) => a.slice(0, -3) === fileName,
  );
  return file ? await parseArticle(file) : null;
};
