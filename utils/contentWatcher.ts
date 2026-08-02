import fs from "node:fs/promises";
import { join, relative } from "node:path";
import logger from "fivelog";

export type ContentEvent = {
  type: "add" | "change" | "unlink";
  fileName: string;
};

export const watchContent = async (
  dir: string,
  callback: (event: ContentEvent) => void,
): Promise<() => void> => {
  logger.log("Watching", dir);
  const ac = new AbortController();

  (async () => {
    try {
      const watcher = fs.watch(dir, { recursive: true, signal: ac.signal });
      for await (const { eventType, filename } of watcher) {
        if (!filename || !filename.endsWith(".md")) continue;

        const fileName = join(dir, filename);

        if (eventType === "change") {
          callback({ type: "change", fileName });
        } else {
          try {
            await fs.access(join(dir, filename));
            callback({ type: "add", fileName });
          } catch {
            callback({ type: "unlink", fileName });
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") throw e;
    }
  })();

  return () => ac.abort();
};
