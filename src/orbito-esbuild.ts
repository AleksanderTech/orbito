import { readFile } from "fs/promises";
import { treeToList } from "./orbito-common";
import * as esbuild from "esbuild";
import { parse } from "acorn";
import * as walk from "acorn-walk";

// transform the code to handle TypeScript or latest JavaScript
const transformCode = (code: string): string => {
  return esbuild.transformSync(code, {
    loader: "ts", // handle both JS and TS
    format: "esm",
  }).code;
};

// safely extract the name of the method
const getMethodName = (keyNode: {
  type: string;
  name: string | null;
}): string | null => {
  if (keyNode.type === "Identifier" || keyNode.type === "PrivateIdentifier") {
    return keyNode.name;
  }
  return null;
};

// check if the string contains the correct class
const isClassMatchingInstance = (
  code: string,
  targetClassName: string,
  targetSuperClassName: string
): boolean => {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  let matches = false;

  walk.simple(ast, {
    ClassDeclaration(node: any) {
      const className: string = node.id?.name || "";
      const superClassName: string | null =
        node.superClass && node.superClass.type === "Identifier"
          ? node.superClass.name
          : null;

      if (
        className === targetClassName &&
        superClassName === targetSuperClassName
      ) {
        matches = true;
      }
    },
  });

  return matches;
};

// remove a specific method (e.g., `html`) by slicing it from the original code
const removeMethodFromClass = (code: string, methodName: string): string => {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  let methodToRemove: { start: number; end: number } | null = null;

  walk.simple(ast, {
    MethodDefinition(node: any) {
      const name = getMethodName(node.key);
      if (name === methodName) {
        methodToRemove = { start: node.start, end: node.end };
      }
    },
  });

  if (!methodToRemove) {
    throw new Error('Orbito components must include an html() method. Please add it.');
  }

  // use the start and end positions to slice the method out of the original code
  const beforeMethod = code.slice(0, methodToRemove.start);
  const afterMethod = code.slice(methodToRemove.end);
  return beforeMethod + afterMethod;
};

export const pagePlugin = async (page) => {
  const generatePageCode = (componentsWithPage) => {
    // create a string representation of components with their ids
    const componentsString = componentsWithPage
      .map(
        ({ constructor }) =>
          `(()=> { const comp = new ${constructor.name}(); return comp; })()`
      )
      .join(",");

    // code to initialize components and execute their 'js' method
    return `
      [${componentsString}].forEach(c => { if(c.js) c.js() });
    `;
  };

  return {
    name: "page-loader",
    setup(build: esbuild.PluginBuild) {
      const componentsWithoutPage = treeToList(page.components);
      const componentsWithPage = [page, ...componentsWithoutPage];

      // iterate over all files where components can be located
      build.onLoad({ filter: new RegExp(`\.(mjs|js|ts)$`) }, async (args) => {
        // read file content
        let contents = await readFile(args.path, { encoding: "utf-8" });
        contents = transformCode(contents);
        const fileExtension = args.path.split(".").pop();
        const loaderType = fileExtension === "ts" ? "ts" : "js";
        // check whether there is a component in the file
        let component = componentsWithoutPage.find((c) =>
          isClassMatchingInstance(contents, c.constructor.name, "Component")
        );
        // if a file is a component
        if (component) {
          const constructorName = component.constructor.name;

          // remove html method to reduce bundle size and register component in the global scope
          const modifiedContents = `
            ${removeMethodFromClass(contents, "html")}
            globalThis.${constructorName} = ${constructorName};
          `;

          return { contents: modifiedContents, loader: loaderType };
        }

        // if a file is the page
        if (
          isClassMatchingInstance(contents, page.constructor.name, "Component")
        ) {
          // remove html method to reduce bundle size and generate page code
          const modifiedContents = `
            ${removeMethodFromClass(contents, "html")}
            ${generatePageCode(componentsWithPage)}
          `;
          return { contents: modifiedContents, loader: loaderType };
        }

        return { contents, loader: loaderType };
      });
    },
  };
};
