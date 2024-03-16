import { exec } from "child_process";
import { readdir, copyFile, mkdir } from "fs/promises";
import * as p from "path";

export function treeToList(tree) {
  let list = [];
  let queue = [...tree];

  while (queue.length) {
    const component = queue.shift();
    list.push(component);
    queue.push(...component.components);
  }

  return list;
}

export async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export async function copyPublicAssets(publicDir, outDir) {
  try {
    await mkdir(outDir, { recursive: true });
    const publicAssets = await readdir(publicDir, { withFileTypes: true });

    for (const asset of publicAssets) {
      const sourceFilePath = p.join(publicDir, asset.name);
      const destFilePath = p.join(outDir, asset.name);

      if (asset.isDirectory()) {
        await copyPublicAssets(sourceFilePath, destFilePath);
      } else {
        await copyFile(sourceFilePath, destFilePath);
      }
    }
  } catch (err) {
    if (err.code != "ENOENT") {
      throw err;
    }
  }
}

export function convertUserPath(userInputPath) {
  const normalizedPath = p.normalize(userInputPath);

  if (process.platform === "win32") {
    return normalizedPath.replaceAll("/", "\\");
  } else {
    return normalizedPath.replaceAll("\\", "/");
  }
}
