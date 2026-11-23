import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(projectRoot, "../網頁");
const publicRoot = resolve(projectRoot, "public");
const embeddedRoot = resolve(publicRoot, "assets/embedded");
const sourcePage = resolve(
  sourceRoot,
  "設計服務價目 · Design Studio│電商 _ 平面 _ 月方案.html",
);

await rm(embeddedRoot, { recursive: true, force: true });
await mkdir(embeddedRoot, { recursive: true });

let html = await readFile(sourcePage, "utf8");
const dataImagePattern = /data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)/g;
const assets = new Map();

for (const match of html.matchAll(dataImagePattern)) {
  const [dataUri, , base64] = match;
  const digest = createHash("sha256").update(base64).digest("hex").slice(0, 16);
  const filename = `${digest}.webp`;
  if (!assets.has(dataUri)) {
    assets.set(dataUri, filename);
    await sharp(Buffer.from(base64, "base64"))
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(resolve(embeddedRoot, filename));
  }
}

html = html.replace(
  dataImagePattern,
  (dataUri) => `assets/embedded/${assets.get(dataUri)}`,
);

html = html
  .replace(/\s*<link rel="canonical" href="https:\/\/your-domain\.com\/">\s*/g, "\n")
  .replace(/\s*<meta property="og:url" content="https:\/\/your-domain\.com\/">\s*/g, "\n")
  .replace(/\s*<meta property="og:image" content="https:\/\/your-domain\.com\/og-image\.jpg">\s*/g, "\n")
  .replace(/\s*<meta property="og:image:width" content="1200">\s*/g, "\n")
  .replace(/\s*<meta property="og:image:height" content="630">\s*/g, "\n")
  .replace(/\s*<meta name="twitter:image" content="https:\/\/your-domain\.com\/og-image\.jpg">\s*/g, "\n");

const portfolioAssets = [
  ["fashion-sale-luxe.png", "fashion-sale-luxe.webp"],
  ["fashion-sale-simple.png", "fashion-sale-simple.webp"],
  ["fashion-mockup-dark.jpg", "fashion-mockup-dark.webp"],
  ["fashion-mockup-bright.jpg", "fashion-mockup-bright.webp"],
];

for (const [sourceName, outputName] of portfolioAssets) {
  html = html.replaceAll(
    `assets/portfolio/${sourceName}`,
    `assets/portfolio/${outputName}`,
  );
}

await writeFile(resolve(publicRoot, "index.html"), html);
await cp(resolve(sourceRoot, "作品案例.html"), resolve(publicRoot, "作品案例.html"));
await cp(resolve(sourceRoot, "assets"), resolve(publicRoot, "assets"), {
  recursive: true,
  force: true,
});

const publicPortfolioRoot = resolve(publicRoot, "assets/portfolio");
await rm(publicPortfolioRoot, { recursive: true, force: true });
await mkdir(publicPortfolioRoot, { recursive: true });

for (const [sourceName, outputName] of portfolioAssets) {
  await sharp(resolve(sourceRoot, "assets/portfolio", sourceName))
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(resolve(publicPortfolioRoot, outputName));
}

console.log(`Prepared site with ${assets.size} optimized images.`);
