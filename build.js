import { access, cp, mkdir, rm } from "node:fs/promises";

const dist = "dist";
const assets = `${dist}/assets`;
const avatarFile = "photo_2026-06-04_03-40-29.jpg";
const screenshotFile = "risk-calculator-screenshot.png";

async function copyIfExists(source, destination) {
  try {
    await access(source);
    await cp(source, destination);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(assets, { recursive: true });
await cp("index.html", `${dist}/index.html`);
await cp("src", `${dist}/src`, { recursive: true });
await copyIfExists(screenshotFile, `${dist}/${screenshotFile}`);
await cp(avatarFile, `${assets}/${avatarFile}`);

console.log("Production build created in dist/");
