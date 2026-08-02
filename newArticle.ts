import logger from "fivelog";

const slug = process.argv[2] ?? `article-${new Date().getTime()}`;
const filePath = `content/articles/${slug}.md`;

const templateData = `---
title: ${slug}
slug: ${slug}
description: ""
published: false
createdAt: ${new Date().toISOString().split("T")[0]}
tags: []
---

# ${slug}

Write your content here.
`;

await Bun.write(filePath, templateData);
logger.log(`Created ${filePath}`);
