// Reads src/data/roadmap.yaml and generates:
//  - src/data/roadmap-nav.json   (navigation tree used by pages)
//  - src/pages/phase/{phaseSlug}/index.astro          (one per phase, generated)
//  - src/pages/phase/{phaseSlug}/{topicSlug}/{level}.mdx (placeholder lessons, skipped if already present)
//
// Re-running is safe: existing lesson MDX files are never overwritten, only
// missing ones are created. Delete a file and re-run to regenerate it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ROADMAP_PATH = path.join(ROOT, "src/data/roadmap.yaml");
const NAV_OUT_PATH = path.join(ROOT, "src/data/roadmap-nav.json");
const PAGES_PHASE_DIR = path.join(ROOT, "src/pages/phase");

const PHASE_META_KEYS = new Set([
  "id",
  "name",
  "duration",
  "objective",
  "short_name",
  "framework",
  "projects",
  "resources",
]);

const LEVELS = ["beginner", "intermediate", "expert"];

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractTopics(phase) {
  const topics = [];
  const seen = new Set();

  const addTopic = (title, category) => {
    let slug = slugify(title);
    if (!slug) return;
    let unique = slug;
    let n = 2;
    while (seen.has(unique)) {
      unique = `${slug}-${n++}`;
    }
    seen.add(unique);
    topics.push({ slug: unique, title, category: category ?? null });
  };

  for (const [key, value] of Object.entries(phase)) {
    if (PHASE_META_KEYS.has(key)) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") addTopic(item, key === "topics" ? null : key);
      }
    } else if (value && typeof value === "object") {
      for (const [subKey, subValue] of Object.entries(value)) {
        if (Array.isArray(subValue)) {
          for (const item of subValue) {
            if (typeof item === "string") addTopic(item, subKey);
          }
        }
      }
    }
  }

  return topics;
}

function buildNav(roadmap) {
  return {
    title: roadmap.title,
    targetRole: roadmap.target_role,
    phases: roadmap.phases.map((phase) => {
      const phaseSlug = `phase-${String(phase.id).padStart(2, "0")}-${slugify(phase.name)}`;
      const topics = extractTopics(phase);
      return {
        id: phase.id,
        slug: phaseSlug,
        name: phase.name,
        duration: phase.duration ?? null,
        objective: phase.objective ?? null,
        topicCount: topics.length,
        topics,
      };
    }),
  };
}

function frontmatterBlock({ title, level, phaseSlug, phaseName, topicSlug, estReadTime }) {
  return `---
layout: ../../../../layouts/Lesson.astro
title: "${title.replace(/"/g, '\\"')}"
level: ${level}
phaseSlug: "${phaseSlug}"
phaseName: "${phaseName.replace(/"/g, '\\"')}"
topicSlug: "${topicSlug}"
estReadTime: ${estReadTime}
resources: []
---
`;
}

function placeholderBody({ title, level }) {
  const levelLabel = level[0].toUpperCase() + level.slice(1);
  return `
## ${levelLabel}: ${title}

_Content coming soon._ This is a scaffolded placeholder generated from \`AI-roadmap.yaml\`.

Replace this file with a real ${level}-level explanation of **${title}**, including
worked examples${level === "expert" ? ", edge cases, and trade-offs" : ""} and any
diagrams you'd like rendered with the \`<Mermaid />\` component, e.g.:

\`\`\`mdx
import Mermaid from "../../../../components/Mermaid.tsx";

<Mermaid client:visible code={\`flowchart LR\\n  A[Start] --> B[Learn ${title}]\\n  B --> C[Practice]\`} />
\`\`\`
`;
}

function ensurePhaseIndexPage(phase) {
  const dir = path.join(PAGES_PHASE_DIR, phase.slug);
  fs.mkdirSync(dir, { recursive: true });
  const indexPath = path.join(dir, "index.astro");
  const content = `---
import PhaseIndexPage from "../../../components/PhaseIndexPage.astro";
import nav from "../../../data/roadmap-nav.json";

const phase = nav.phases.find((p) => p.slug === "${phase.slug}");
---
<PhaseIndexPage phase={phase} />
`;
  fs.writeFileSync(indexPath, content, "utf8");
}

function ensureLessonPages(phase) {
  for (const topic of phase.topics) {
    const topicDir = path.join(PAGES_PHASE_DIR, phase.slug, topic.slug);
    fs.mkdirSync(topicDir, { recursive: true });
    for (const level of LEVELS) {
      const filePath = path.join(topicDir, `${level}.mdx`);
      if (fs.existsSync(filePath)) continue; // never clobber authored content
      const fm = frontmatterBlock({
        title: topic.title,
        level,
        phaseSlug: phase.slug,
        phaseName: phase.name,
        topicSlug: topic.slug,
        estReadTime: 5,
      });
      const body = placeholderBody({ title: topic.title, level });
      fs.writeFileSync(filePath, fm + body, "utf8");
    }
  }
}

function main() {
  const roadmap = yaml.load(fs.readFileSync(ROADMAP_PATH, "utf8")).roadmap;
  const nav = buildNav(roadmap);

  fs.writeFileSync(NAV_OUT_PATH, JSON.stringify(nav, null, 2), "utf8");

  let created = 0;
  let totalTopics = 0;
  for (const phase of nav.phases) {
    ensurePhaseIndexPage(phase);
    totalTopics += phase.topics.length;
    const before = countFiles(path.join(PAGES_PHASE_DIR, phase.slug));
    ensureLessonPages(phase);
    const after = countFiles(path.join(PAGES_PHASE_DIR, phase.slug));
    created += after - before;
  }

  console.log(`Generated nav for ${nav.phases.length} phases, ${totalTopics} topics.`);
  console.log(`Created ${created} new lesson MDX files (existing ones left untouched).`);
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
}

main();
