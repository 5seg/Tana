import { join } from "node:path";

export type Article = {
  title: string;
  slug: string;
  description: string;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  body: string;
};

const parseValue = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const validate = (
  fields: Record<string, unknown>,
  fileName: string,
): Omit<Article, "body"> => {
  const { title, slug, description, published, createdAt, updatedAt, tags } =
    fields;

  if (typeof title !== "string" || !title)
    throw new Error(`Missing or invalid 'title' in ${fileName}`);
  if (typeof slug !== "string" || !slug)
    throw new Error(`Missing or invalid 'slug' in ${fileName}`);
  if (typeof description !== "string")
    throw new Error(`Missing or invalid 'description' in ${fileName}`);
  if (typeof published !== "boolean")
    throw new Error(`Missing or invalid 'published' in ${fileName}`);
  if (typeof createdAt !== "string" || isNaN(Date.parse(createdAt)))
    throw new Error(`Invalid 'createdAt' in ${fileName}`);
  if (
    updatedAt !== undefined &&
    (typeof updatedAt !== "string" || isNaN(Date.parse(updatedAt)))
  )
    throw new Error(`Invalid 'updatedAt' in ${fileName}`);
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string"))
    throw new Error(`Invalid 'tags' in ${fileName}`);

  return {
    title,
    slug,
    description,
    published,
    createdAt,
    updatedAt,
    tags,
  };
};

export const parseArticle = async (fileName: string): Promise<Article> => {
  const raw = (
    await Bun.file(
      join(import.meta.dirname!, "..", "content", "articles", fileName),
    ).text()
  ).replace(/\r\n/g, "\n");

  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match || match[1] === undefined || match[2] === undefined)
    throw new Error(`Invalid frontmatter in ${fileName}`);

  const frontmatter = match[1];
  const body = match[2];
  const fields: Record<string, unknown> = {};

  for (const line of frontmatter.split("\n")) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    fields[line.slice(0, sep).trim()] = parseValue(line.slice(sep + 1));
  }

  return { ...validate(fields, fileName), body: body.trim() };
};
