// Dev-only "/api/links" endpoint for adding links from the UI.
// Wired via the astro:server:setup hook, which only fires for `astro dev` —
// it never runs during `astro build`, so it can't affect the static build
// or need a server adapter.
import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

function readLinks(linksPath) {
  const parsed = yaml.load(fs.readFileSync(linksPath, "utf-8"));
  return parsed?.links ?? [];
}

function writeLinks(linksPath, links) {
  fs.writeFileSync(linksPath, yaml.dump({ links }), "utf-8");
}

export default function linksApi() {
  return {
    name: "links-api",
    hooks: {
      "astro:server:setup": ({ server }) => {
        const linksPath = path.join(process.cwd(), "src/data/links.yaml");

        server.middlewares.use("/api/links", (req, res) => {
          res.setHeader("Content-Type", "application/json");

          if (req.method === "GET") {
            res.end(JSON.stringify(readLinks(linksPath)));
            return;
          }

          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", () => {
              let parsed;
              try {
                parsed = JSON.parse(body);
              } catch {
                parsed = null;
              }

              const topic = typeof parsed?.topic === "string" ? parsed.topic.trim() : "";
              const url = typeof parsed?.url === "string" ? parsed.url.trim() : "";
              const notes = typeof parsed?.notes === "string" ? parsed.notes.trim() : "";

              if (!topic || !url) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Topic and URL are required." }));
                return;
              }

              try {
                new URL(url);
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "URL must be a valid, fully-qualified URL." }));
                return;
              }

              const links = readLinks(linksPath);
              links.push(notes ? { topic, url, notes } : { topic, url });
              writeLinks(linksPath, links);
              res.end(JSON.stringify(links));
            });
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed." }));
        });
      },
    },
  };
}
