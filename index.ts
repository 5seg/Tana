import Elysia, { NotFoundError } from "elysia";
import logger from "fivelog";
import { join } from "node:path";
import { watchContent } from "./utils/contentWatcher";
import { getArticle, getArticlesList } from "./utils/contentManager";

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

new Elysia()
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
  .listen(5555);

logger.info("Running on http://127.0.0.1:5555");
