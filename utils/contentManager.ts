import logger from "fivelog";
import fs from "node:fs/promises";
import { join } from "node:path";
import { parseArticle, type Article } from "./articleParser";

export const getArticlesList = async () => {
  const articlesDir = join(__dirname, "../content/articles");
  const files = (await fs.readdir(articlesDir)).filter((a) =>
    a.endsWith(".md"),
  );
  let articles: Article[] = [];
  for (const file of files) {
    articles.push(await parseArticle(file));
  }
  return articles;
};

export const getArticle = async (fileName: string) => {
  const articlesDir = join(__dirname, "../content/articles");
  const file = (await fs.readdir(articlesDir)).find(
    (a) => a.slice(0, -3) === fileName,
  );
  return file ? await parseArticle(file) : null;
};
