import logger from "fivelog";
import fs from "fs/promises";

logger.log("Initializing...");

if (await fs.exists("content")) {
  logger.log("Content dir is already exists. Skipping...");
} else {
  logger.log("Creating content dir");
  await fs.mkdir("content");
}
