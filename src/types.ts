export type Env = {
  DB: D1Database;
  KV: KVNamespace;
  API_TOKEN: string;
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  body: string;
  published: boolean;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
};

export type ArticleRow = {
  slug: string;
  title: string;
  description: string;
  body: string;
  published: number;
  tags: string;
  created_at: string;
  updated_at: string | null;
};
