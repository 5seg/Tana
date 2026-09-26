import Elysia, { NotFoundError } from "elysia";
import { cors } from "@elysiajs/cors";
import logger from "fivelog";
import { join } from "node:path";
import { watchContent } from "./utils/contentWatcher";
import {
  getArticle,
  getArticlesList,
  saveArticleContent,
  deleteArticleContent,
} from "./utils/contentManager";

watchContent(join(__dirname, "content/articles"), async (ev) => {
  switch (ev.type) {
    case "add":
      logger.info("Added:", ev.fileName);
      break;
    case "change":
      logger.info("Modified:", ev.fileName);
      break;
    case "unlink":
      logger.info("Deleted:", ev.fileName);
  }
});

const checkAuth = (
  headers: Record<string, string | undefined>,
  set: { status?: number | string },
) => {
  const secretToken = process.env.TANA_API_TOKEN;
  if (!secretToken) {
    return true;
  }
  const auth = headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    set.status = 401;
    return false;
  }
  if (auth.slice(7).trim() !== secretToken.trim()) {
    set.status = 403;
    return false;
  }
  return true;
};

const handleCreate = async ({
  body,
  headers,
  set,
}: {
  body: any;
  headers: Record<string, string | undefined>;
  set: any;
}) => {
  if (!checkAuth(headers, set)) {
    return {
      error:
        set.status === 401
          ? "Unauthorized: Missing Token"
          : "Forbidden: Invalid Token",
    };
  }
  if (!body || !body.slug || !body.title) {
    set.status = 400;
    return { error: "Slug and title are required" };
  }
  try {
    return await saveArticleContent(body, false);
  } catch (e: any) {
    set.status = e.message.includes("already exists") ? 409 : 400;
    return { error: e.message };
  }
};

const handleUpdate = async ({
  params,
  body,
  headers,
  set,
}: {
  params: { slug: string };
  body: any;
  headers: Record<string, string | undefined>;
  set: any;
}) => {
  if (!checkAuth(headers, set)) {
    return {
      error:
        set.status === 401
          ? "Unauthorized: Missing Token"
          : "Forbidden: Invalid Token",
    };
  }
  const slug = params.slug;
  if (!slug) {
    set.status = 400;
    return { error: "Slug is required" };
  }
  try {
    return await saveArticleContent({ ...body, slug }, true);
  } catch (e: any) {
    set.status = e.message.includes("not found") ? 404 : 400;
    return { error: e.message };
  }
};

const handleDelete = async ({
  params,
  headers,
  set,
}: {
  params: { slug: string };
  headers: Record<string, string | undefined>;
  set: any;
}) => {
  if (!checkAuth(headers, set)) {
    return {
      error:
        set.status === 401
          ? "Unauthorized: Missing Token"
          : "Forbidden: Invalid Token",
    };
  }
  try {
    return await deleteArticleContent(params.slug);
  } catch (e: any) {
    set.status = e.message.includes("not found") ? 404 : 400;
    return { error: e.message };
  }
};

new Elysia()
  .use(cors())
  .onRequest(({ request }) => {
    console.log(`→ ${request.method} ${request.url}`);
  })
  .onAfterResponse(({ request, set }) => {
    console.log(`← ${request.method} ${request.url} [${set.status}]`);
  })
  .onError(({ code, status, set, error }) => {
    if (code === "NOT_FOUND") {
      return status(404, { error: error.message ?? "Not Found" });
    }
  })
  .get("/", () => "Tana is working!")
  .get("/articles", async ({ query }) => {
    const limit = Number(query.limit ?? 10);
    const offset = Number(query.offset ?? 0);
    return await getArticlesList(limit, offset);
  })
  .get("/articles/:slug", async ({ params }) => {
    const article = await getArticle(params.slug);
    if (!article) throw new NotFoundError("Article Not Found");
    return article;
  })
  .post("/articles", handleCreate)
  .post("/api/articles", handleCreate)
  .put("/articles/:slug", handleUpdate)
  .put("/api/articles/:slug", handleUpdate)
  .delete("/articles/:slug", handleDelete)
  .delete("/api/articles/:slug", handleDelete)
  .listen(5555);

logger.info("Running on http://127.0.0.1:5555");
