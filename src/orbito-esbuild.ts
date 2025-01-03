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

const extractAliasMap = (code: string): Map<string, string> => {
  const aliasMap = new Map<string, string>();
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });

  walk.simple(ast, {
    ImportDeclaration(node) {
      node.specifiers.forEach((specifier) => {
        if (specifier.type === "ImportSpecifier") {
          if (specifier.imported.type === "Identifier") {
            aliasMap.set(specifier.local.name, specifier.imported.name);
          }
        } else if (specifier.type === "ImportDefaultSpecifier") {
          aliasMap.set(specifier.local.name, "default");
        } else if (specifier.type === "ImportNamespaceSpecifier") {
          aliasMap.set(specifier.local.name, "*");
        }
      });
    },
  });

  return aliasMap;
};

// check if the string contains the correct class
const isClassMatchingInstance = (
  code: string,
  targetClassName: string,
  targetSuperClassName: string
): boolean => {
  const aliasMap = extractAliasMap(code);

  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  let matches = false;

  const processClassNode = (node: any) => {
    const className: string = node.id?.name || "AnonymousClass";
    const superClassName: string | null =
      node.superClass && node.superClass.type === "Identifier"
        ? node.superClass.name
        : null;

    const resolvedSuperClassName =
      aliasMap.get(superClassName || "") || superClassName;

    if (
      className === targetClassName &&
      resolvedSuperClassName === targetSuperClassName
    ) {
      matches = true;
    }
  };
  
  walk.simple(ast, {
    ClassDeclaration: processClassNode,
    ClassExpression: processClassNode,
  });

  return matches;
};

const removeMethodFromClass = (
  code: string,
  methodName: string,
  targetSuperClassName: string
): string => {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const rangesToRemove: { start: number; end: number }[] = [];

  const processClassNode = (node: any) => {
    const superClassName =
      node.superClass && node.superClass.type === "Identifier"
        ? node.superClass.name
        : null;

    node.body.body.forEach((classElement: any) => {
      if (classElement.type === "MethodDefinition") {
        const name =
          classElement.key.type === "Identifier"
            ? classElement.key.name
            : null;

        if (name === methodName && superClassName === targetSuperClassName) {
          rangesToRemove.push({
            start: classElement.start,
            end: classElement.end,
          });
        }
      }
    });
  };

  walk.simple(ast, {
    ClassExpression: processClassNode,
    ClassDeclaration: processClassNode,
  });

  let modifiedCode = code;
  rangesToRemove.reverse().forEach(({ start, end }) => {
    const beforeMethod = modifiedCode.slice(0, start);
    const afterMethod = modifiedCode.slice(end);
    modifiedCode = beforeMethod + afterMethod;
  });

  return modifiedCode;
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
        let component = componentsWithoutPage.find((c) => {
          return isClassMatchingInstance(
            contents,
            c.constructor.name,
            "Component"
          );
        });

        // if a file is a component
        if (component) {
          const constructorName = component.constructor.name;
          const modifiedContents = `
          ${contents}
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
            ${contents}
            ${generatePageCode(componentsWithPage)}
            globalThis.${page.constructor.name} = ${page.constructor.name};
            globalThis.Component = Component;
          `;
          return { contents: modifiedContents, loader: loaderType };
        }

        return { contents, loader: loaderType };
      });

      build.onEnd((result) => {
        const updatedOutputFiles = result.outputFiles.map((file) => {
          let contents = file.text;

          // js proper variable regex
          const match = contents.match(
            /globalThis\.Component=([a-zA-Z_$][\w$]*)/
          );

          if (match) {
            const superClassName = match[1];
            contents = `${removeMethodFromClass(
              contents,
              "html",
              superClassName
            )}`;
          }

          return {
            ...file,
            text: contents,
          };
        });

        result.outputFiles = updatedOutputFiles;
      });
    },
  };
};
