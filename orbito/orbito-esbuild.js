import { readFile } from "fs/promises";
import { treeToList } from "./orbito-common.js";

export const pagePlugin = async (page) => {
  const generatePageCode = (componentsWithPage) => {
    // create a string representation of components with their ids
    const componentsString = componentsWithPage
      .map(({ constructor, id }) => `(()=> { const comp = new ${constructor.name}(); comp.id = "${id}"; return comp; })()`)
      .join(",");

    // code to initialize components and execute their 'js' method
    return `
      [${componentsString}].forEach(c => { if(c.js) c.js() });
    `;
  };

  return {
    name: "page-loader",
    setup(build) {
      const componentsWithoutPage = treeToList(page.components);
      const componentsWithPage = [page, ...componentsWithoutPage];

      // iterate over all files where components can be located
      build.onLoad({ filter: new RegExp(`\.(mjs|js|ts)$`) }, async (args) => {
        // read file content
        let contents = await readFile(args.path, { encoding: "utf-8" });
        // check whether there is a component in the file
        let component = componentsWithoutPage.find((c) => contents.includes(c.constructor.toString()));

        // if a file is a component
        if (component) {
          const constructorName = component.constructor.name;
          const modifiedContents = `
            ${contents.replace(component.html.toString(), "")}
            globalThis.${constructorName} = ${constructorName};
          `;
          // remove html method to reduce bundle size and register component in the global scope
          return {
            contents: modifiedContents,
            loader: "js",
          };
        }

        // if a file is the page
        if (contents.includes(page.constructor.toString())) {
          // remove html method to reduce bundle size and generate page code
          const modifiedContents = `
            ${contents.replace(page.html.toString(), "")}
            ${generatePageCode(componentsWithPage)}
          `;
          return { contents: modifiedContents, loader: "js" };
        }

        return { contents, loader: "js" };
      });
    },
  };
};
