import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import * as esbuild from "esbuild";
import * as p from "path";
import { createHash } from "crypto";
import { treeToList, copyPublicAssets, runCommand, convertUserPath } from "./orbito-common";
import { pagePlugin } from "./orbito-esbuild";
import { Component } from "./component";
import { pathToFileURL } from "url";

globalThis.html = String.raw;
globalThis.md = String.raw;
globalThis.js = String.raw;

export class Orbito {
  ssr: boolean;
  componentsPath: string;
  assetsPath: string;
  assetsDir: string;
  publicPath: string;
  outPath: string;
  jsPlaceholder: string;
  integrations: { tailwindCss?: { cssPath: string } };
  assetsOutPath: string;

  constructor({
    ssr = false,
    componentsPath = "src",
    assetsPath = "src/assets",
    publicPath = "public",
    outPath = "out",
    jsPlaceholder = "|js|",
    integrations = {},
  } = {}) {
    this.ssr = ssr;
    this.componentsPath = convertUserPath(componentsPath);
    this.assetsPath = convertUserPath(assetsPath);
    this.assetsDir = p.basename(this.assetsPath);
    this.publicPath = convertUserPath(publicPath);
    this.outPath = convertUserPath(outPath);
    this.jsPlaceholder = jsPlaceholder;
    this.integrations = integrations;
    this.assetsOutPath = p.join(this.outPath, this.assetsDir);
  }

  async page({ component, filePath, route }) {
    component = component instanceof Component ? component : new component();
    filePath = convertUserPath(filePath);
    
    if (!this.ssr) {
      route = convertUserPath(route);
      const pageDir = p.join(this.outPath, route);
      await mkdir(pageDir, { recursive: true });
    }

    // get page html string
    let html = await component.html();

    // transform components from tree to list
    const components = treeToList(component.components);

    // public folder
    await copyPublicAssets(this.publicPath, this.outPath);

    // assets folder
    const assetsMap = await this.hashAssets();

    // handle integrations
    this.handleIntegrations(assetsMap);

    // replace assets ids with hashed names
    html = this.replaceAssetsIdsWithHashedNames([component, ...components], html, assetsMap);

    const esbuildOutput = await esbuild.build({
      entryPoints: [p.join(this.componentsPath, filePath)],
      bundle: true,
      minify: true,
      treeShaking: true,
      plugins: [await pagePlugin(component)],
      write: false,
    });

    // inject bundled js into html and write the result to the destination directory
    const bundledJs = esbuildOutput.outputFiles[0].text;
    html = html.replace(this.jsPlaceholder, bundledJs);
    if (this.ssr) {
      return html;
    } else {
      await writeFile(p.join(this.outPath, route, "index.html"), html, { encoding: "utf-8" });
    }
  }

  async pages(path) {
    path = p.join(this.componentsPath, convertUserPath(path));
    const pages = [];

    for (const filename of await readdir(path)) {
      if (new RegExp(`\.(mjs|js|ts)$`).test(filename)) {
        const imports = await import(pathToFileURL(p.join(process.cwd(), path, filename)).href);
        const postComponentClass = Object.values(imports).find((imp) => imp["prototype"] instanceof Component);
        if (postComponentClass) pages.push({ componentClass: postComponentClass, filename });
      }
    }

    return pages;
  }

  replaceAssetsIdsWithHashedNames(componentsWithPage, html, assetsMap) {
    for (const c of componentsWithPage) {
      for (const a of c.assets) {
        const assetFullPath = p.join(this.assetsPath, convertUserPath(a.assetPath));
        const assetUrl = `/${this.assetsDir}/${assetsMap.get(assetFullPath)}`;
        html = html.replaceAll(a.id, assetUrl);
      }
    }

    return html;
  }

  // read all files in assets directory, calculate hash for them, write them to destination directory with hash in the file name.
  async hashAssets() {
    try {
      let assets = await readdir(this.assetsPath, { recursive: true, withFileTypes: true });
      const assetsMap = new Map();

      for (const asset of assets) {
        if (asset.isFile()) {
          const filePath = p.join(asset.path, asset.name);
          const file = await readFile(filePath);
          const fileHash = await createHash("sha256").update(file).digest("hex");
          const { name, ext } = p.parse(asset.name);
          assetsMap.set(filePath, `${name}.${fileHash}${ext}`);
          await mkdir(this.assetsOutPath, { recursive: true });
          await writeFile(p.join(this.assetsOutPath, assetsMap.get(filePath)), file);
        }
      }

      return assetsMap;
    } catch (err) {
      if (err.code != "ENOENT") {
        throw err;
      }
      return new Map();
    }
  }

  async handleIntegrations(assetsMap) {
    if (this.integrations.tailwindCss) {
      const tailwindCssFilename = assetsMap.get(this.integrations.tailwindCss.cssPath);
      const tailwindCssPath = p.join(this.assetsOutPath, tailwindCssFilename);
      await runCommand(`tailwindcss -i ${tailwindCssPath} -o ${tailwindCssPath} --minify`);
    }
  }
}
