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

export interface SaveArticleInput {
  slug: string;
  title: string;
  description?: string;
  body?: string;
  published?: boolean;
  tags?: string[];
}

export const saveArticleContent = async (
  input: SaveArticleInput,
  isEdit: boolean,
) => {
  const articlesDir = join(__dirname, "../content/articles");
  const cleanSlug = input.slug.trim();

  // Validate slug to prevent path traversal
  if (!cleanSlug || !/^[a-zA-Z0-9_-]+$/.test(cleanSlug)) {
    throw new Error(
      "Invalid slug. Only alphanumeric characters, hyphens, and underscores are allowed.",
    );
  }

  const filePath = join(articlesDir, `${cleanSlug}.md`);
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

  if (!isEdit && exists) {
    throw new Error(`Article with slug "${cleanSlug}" already exists`);
  }
  if (isEdit && !exists) {
    throw new Error(`Article with slug "${cleanSlug}" not found`);
  }

  let createdAt = new Date().toISOString();
  if (isEdit && exists) {
    try {
      const existing = await parseArticle(`${cleanSlug}.md`);
      if (existing.createdAt) {
        createdAt = existing.createdAt;
      }
    } catch (e) {
      logger.warn(`Could not parse existing createdAt for ${cleanSlug}:`, e);
    }
  }

  const updatedAt = new Date().toISOString();
  const safeTitle = JSON.stringify(input.title ?? cleanSlug);
  const safeDescription = JSON.stringify(input.description ?? "");
  const tagsArray = Array.isArray(input.tags) ? input.tags : [];
  const safeTags = `[${tagsArray.map((t) => JSON.stringify(String(t))).join(", ")}]`;

  const fileContent = `---
title: ${safeTitle}
slug: ${cleanSlug}
description: ${safeDescription}
published: ${input.published ?? true}
createdAt: ${createdAt}
updatedAt: ${updatedAt}
tags: ${safeTags}
---

${input.body ?? ""}
`;

  await Bun.write(filePath, fileContent);
  logger.info(`Article saved: ${cleanSlug}`);
  return { ok: true, slug: cleanSlug };
};

export const deleteArticleContent = async (slug: string) => {
  const articlesDir = join(__dirname, "../content/articles");
  const cleanSlug = slug.trim();
  if (!cleanSlug || !/^[a-zA-Z0-9_-]+$/.test(cleanSlug)) {
    throw new Error("Invalid slug.");
  }
  const filePath = join(articlesDir, `${cleanSlug}.md`);
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    throw new Error(`Article with slug "${cleanSlug}" not found`);
  }
  await fs.unlink(filePath);
  logger.info(`Article deleted: ${cleanSlug}`);
  return { ok: true, slug: cleanSlug };
};
