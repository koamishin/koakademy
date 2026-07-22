#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");

const documents = [
    { source: "GETTING_STARTED.md", target: "docs/src/content/docs/self-hosting/installation.mdx", title: "Installation", description: "Install KoAkademy with the supported production topology." },
    { source: "DEPLOYMENT.md", target: "docs/src/content/docs/self-hosting/deployment.mdx", title: "Deployment", description: "Deploy, upgrade, back up, and recover KoAkademy." },
    { source: "CONFIGURATION.md", target: "docs/src/content/docs/self-hosting/configuration.mdx", title: "Configuration", description: "Production environment and service configuration." },
    { source: "TROUBLESHOOTING.md", target: "docs/src/content/docs/self-hosting/troubleshooting.mdx", title: "Troubleshooting", description: "Diagnose self-hosted KoAkademy deployments." },
    { source: "CONTRIBUTING.md", target: "docs/src/content/docs/start-here/contributing.mdx", title: "Contributing", description: "Contribution workflow, validation, and documentation ownership." },
    { source: "DEVELOPMENT.md", target: "docs/src/content/docs/start-here/development.mdx", title: "Development", description: "Set up and validate a KoAkademy development environment." },
    { source: "ARCHITECTURE.md", target: "docs/src/content/docs/start-here/architecture.mdx", title: "Architecture", description: "Runtime services, application boundaries, and data flows." },
    { source: "FAQ.md", target: "docs/src/content/docs/self-hosting/faq.mdx", title: "FAQ", description: "Answers about support, deployment, storage, PDFs, and APIs." },
];

const targetBySource = new Map(documents.map((document) => [document.source, document.target]));
const repositoryDocuments = new Set([
    "README.md",
    "SECURITY.md",
    "CHANGELOG.md",
    "LICENSE.md",
]);

function documentationLink(fromTarget, sourceTarget, anchor = "") {
    const target = targetBySource.get(sourceTarget);

    if (!target) {
        if (repositoryDocuments.has(sourceTarget)) {
            return `https://github.com/yukazakiri/koakademy/blob/master/${sourceTarget}${anchor}`;
        }

        return `${sourceTarget}${anchor}`;
    }

    const fromDirectory = path.posix.dirname(fromTarget.replace(/^docs\/src\/content\/docs\//, ""));
    const targetRoute = target
        .replace(/^docs\/src\/content\/docs\//, "")
        .replace(/\.mdx$/, "");
    let relative = path.posix.relative(fromDirectory, targetRoute);

    if (!relative.startsWith(".")) {
        relative = `./${relative}`;
    }

    return `${relative}/${anchor}`;
}

function render(document, source) {
    const body = source
        .replace(/^# .+\r?\n+/, "")
        .replace(/\]\(([A-Z][A-Z_]+\.md)(#[^)]+)?\)/g, (_match, target, anchor = "") => `](${documentationLink(document.target, target, anchor)})`)
        .trim();

    return `---\ntitle: ${document.title}\ndescription: ${document.description}\n---\n\n{/* GENERATED FILE. Source: /${document.source}. Run: npm run docs:sync */}\n\n${body}\n`;
}

const stale = [];

for (const document of documents) {
    const source = await readFile(path.join(root, document.source), "utf8");
    const expected = render(document, source);
    let actual = "";

    try {
        actual = await readFile(path.join(root, document.target), "utf8");
    } catch {
        // A missing mirror is stale and will be created outside check mode.
    }

    if (actual === expected) {
        continue;
    }

    stale.push(document.target);

    if (!checkOnly) {
        await mkdir(path.dirname(path.join(root, document.target)), { recursive: true });
        await writeFile(path.join(root, document.target), expected, "utf8");
    }
}

if (stale.length > 0 && checkOnly) {
    console.error(`Generated documentation is stale:\n${stale.map((file) => `- ${file}`).join("\n")}`);
    process.exitCode = 1;
} else if (stale.length > 0) {
    console.log(`Updated ${stale.length} generated documentation mirror(s).`);
} else {
    console.log("Generated documentation mirrors are current.");
}
