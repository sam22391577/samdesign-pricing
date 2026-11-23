import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appOutput = resolve(projectRoot, "gh-pages-app");
const output = resolve(projectRoot, "gh-pages-dist");
const publicRoot = resolve(projectRoot, "public");

await rm(appOutput, { recursive: true, force: true });
await rm(output, { recursive: true, force: true });

await build({ configFile: resolve(projectRoot, "vite.github-pages.config.ts") });

await mkdir(resolve(output, "calculator"), { recursive: true });
await cp(resolve(appOutput, "index.html"), resolve(output, "calculator/index.html"));
await cp(resolve(appOutput, "_calculator"), resolve(output, "_calculator"), { recursive: true });
await cp(resolve(publicRoot, "assets"), resolve(output, "assets"), {
  recursive: true,
  filter: (source) => !source.endsWith("/brand/line-contact-qr.png"),
});

for (const filename of ["favicon.svg", "file.svg", "globe.svg", "window.svg", "作品案例.html"]) {
  await cp(resolve(publicRoot, filename), resolve(output, filename));
}

const homepage = (await readFile(resolve(publicRoot, "index.html"), "utf8"))
  .replaceAll('href="/calculator', 'href="/samdesign-pricing/calculator/')
  .replaceAll('href="作品案例.html"', 'href="/samdesign-pricing/作品案例.html"');

await writeFile(resolve(output, "index.html"), homepage);
await writeFile(resolve(output, ".nojekyll"), "");
await rm(appOutput, { recursive: true, force: true });

console.log("GitHub Pages output prepared in gh-pages-dist");
