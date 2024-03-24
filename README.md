# Orbito (SSG framework)

Orbito is a static site generator (SSG) written in JavaScript using Node.js. It allows you to generate static HTML files with bundled JavaScript for your web pages.

## Requirements

- Node v20 or later

## Orbito in Node.js

With just a few lines of simple Node.js code, you're ready to go with Orbito:

```js
import { Orbito } from "orbito";
import { Home } from "./src/home.js";

const orbito = new Orbito();
await orbito.page({ component: Home, filePath: "home.js", route: "/home" });
```

This call will generate a single HTML file for the "Home" page and save it under outPath/home directory.

You don't need any magical syntax. Orbito components are written in vanilla JavaScript:

```js
import { Component } from "orbito/lib/component.js";

export class Home extends Component {
  html() {
    return html` <h1>Welcome Home.</h1> `;
  }

  js() {
    console.log("Welcome Home.");
  }
}
```

In Orbito you can easily use "orbito.page" and "orbito.pages" right in your Node.js scripts.

This means you can add Orbito to your existing Node.js projects without extra hassle.

## Getting Started

```bash
npm i orbito
```

To use Orbito, simply import Orbito and create an instance:

```js
import { Orbito } from "orbito";

const orbito = new Orbito();
```

## Orbito Configuration

Orbito configuration with default values:

```js
import { Orbito } from "orbito";

const orbito = new Orbito({
  // Path to the directory containing components
  componentsPath: "src",
  // Path to the directory containing static assets
  assetsPath: "src/assets",
  // Path to the public directory containing assets to be copied as-is
  publicPath: "public",
  // Output directory for the generated files
  outPath: "out",
  // Placeholder string to be replaced with JavaScript code in HTML files
  jsPlaceholder: "|js|",
  // Integrations with other tools or libraries
  integrations: {
    // Example integration with a CSS framework
    tailwindCss: { ... },
  },
});
```

## Generating Single Page

If you want to generate a single page (one HTML file) with Orbito, you can use the orbito.page method. This method allows you to define a specific page along with its associated route.

```js
await orbito.page({ component: Home, filePath: "home.js", route: "/home" });
```

- component: The Component (Class definition or an instance).

- filePath: Specifies the file path where the component is declared. This can be a simple file name or a path if the file is located deeper in the directory structure.

- route: Defines the route path for the page. This parameter is a string representing the URL path at which the page will be accessible.

## Generating Multiple Pages

If you need to generate multiple pages with Orbito, you can use the orbito.pages method. This method returns list of components that are located under the given path.

```js
// given components are located under ${orbito.componentsPath}/posts
const posts = await orbito.pages("posts");

for (const post of posts) {
  await orbito.page({
    component: post.componentClass,
    filePath: `posts/${post.filename}`,
    route: post.componentClass.slug,
  });
}
```

### Happy coding!
