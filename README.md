# Orbito (SSG + SSR)

Orbito is a Node.js site generator that can write static HTML files or return server-rendered HTML, with a bundled client script when you need it.

Works with JavaScript or TypeScript, and with ESM or CommonJS projects.

## Requirements

- Node v20 or later

## Getting Started

```bash
npm i orbito
```

To use Orbito, simply import Orbito and create an instance:

```js
import { Orbito } from "orbito";

const orbito = new Orbito();
```

## Components (the building block)

Components live under `componentsPath` (default `src`). Each component has:

- `html()` - must return an HTML string.
- `js()` - optional client-side code that runs for this component after the bundle loads.

Example `src/home.js`:

```js
import { Component } from "orbito/lib/component";

export class Home extends Component {
  html() {
    return `<h1>Welcome Home.</h1>`;
  }

  js() {
    console.log("Welcome Home.");
  }
}
```

## Generate a page

Put your component file under `componentsPath` and point `orbito.page` at it:

```js
import { Orbito } from "orbito";
import { Home } from "./src/home.js";

const orbito = new Orbito();
await orbito.page({ component: Home, filePath: "home.js", route: "/home" });
```

Orbito defaults to SSG, so the snippet above writes `out/home/index.html`. To get the HTML string in an endpoint, enable SSR:

```js
import { Orbito } from "orbito";
import { Home } from "./src/home.js";

const orbito = new Orbito({ ssr: true });

// simplest Express handler
app.get("/home", async (req, res) => {
  const html = await orbito.page({ component: Home, filePath: "home.js" });
  res.type("html").send(html);
});
```

## Orbito Configuration

Orbito configuration with default values:

```js
import { Orbito } from "orbito";

const orbito = new Orbito({
  // Toggle SSR (returns HTML string) or SSG (writes files)
  ssr: false,
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
  // Cache for skipping identical bundles
  cacheConfig: { timeInSec: 300, maxSize: 300 },
  // Integrations with other tools or libraries
  integrations: {
    // Example integration with a CSS framework
    tailwindCss: { ... },
  },
});
```

## SSR vs SSG

- `ssr: false` (default) writes `index.html` files to `outPath/route`.
- `ssr: true` returns the HTML string from `orbito.page(...)` instead of writing to disk. You decide how to serve or save it.
- In SSR mode Orbito does not write to `outPath` or copy assets/public files; you handle serving/copying yourself.

## Generating Single Page

If you want to generate a single page with Orbito, you can use the orbito.page method. This method allows you to define a specific page along with its associated route.

```js
await orbito.page({ component: Home, filePath: "home.js", route: "/home" });
```

- component: The Component (Class definition or an instance).

- filePath: Specifies the file path where the component is declared. This can be a simple file name or a path if the file is located deeper in the directory structure.

- route: Defines the route path for the page (used to create folders under `outPath` in SSG). In SSR it is not used. In SSG, `route: "/home"` means the page is available at `/home/`.

## Generating Multiple Pages

If you need to generate multiple pages with Orbito, you can use the orbito.pages method. This method returns list of components that are located under the given path.

```js
// given components are located under ${orbito.componentsPath}/posts
const posts = await orbito.pages("posts");

for (const post of posts) {
  await orbito.page({
    component: post.componentClass,
    filePath: `posts/${post.filename}`,
    route: post.componentClass.slug, // pick any route; slug is just an example
  });
}
```

`orbito.pages(path)` looks for `.js`, `.mjs`, or `.ts` files under that folder, imports them, and returns classes that extend `Component`. You still choose the route for each page.

If you like the `slug` pattern, add it yourself in the component class, e.g. `export class Post extends Component { static slug = "/my-post"; ... }`.

## Nesting & passing data

Components extend `Component`. You can nest them with `useComponent`:

`useComponent` accepts a class or an instance.

```js
import { Component } from "orbito/lib/component";

export class Layout extends Component {
  html() {
    const hero = this.useComponent(new Hero({ title: "Some title" })); // pass via constructor
    return `
      <main>
        ${hero.html()} ${this.useComponent(Footer).html({
          links: ["Docs", "Blog"],
        })}
        <!-- pass via html props -->
      </main>
    `;
  }
}

export class Hero extends Component {
  constructor({ title }) {
    super();
    this.title = title;
  }

  html() {
    return `<section><h1>${this.title}</h1></section>`;
  }
}

export class Footer extends Component {
  html({ links = [] } = {}) {
    return `<footer>${links.map((l) => `<a>${l}</a>`).join("")}</footer>`;
  }
}
```

Two ways to pass data:

- Via constructor: instantiate yourself (`new Hero({ title })`) and pass it. Read props in the constructor and store them on `this`.
- Via `html()` props (preferred): call `.html({ ... })` on the instance.

On the receiving side, read constructor params (like `Hero`) or the `html` arguments (like `Footer`) as shown above.

## Assets and public files

- Put versioned assets in `assetsPath` (default `src/assets`). Use `asset()` to reference them. Orbito copies them to `outPath/<assetsDir>` with a hash in the filename and replaces the placeholder ID in your HTML.
- Everything in `publicPath` (default `public`) is copied as-is to `outPath`.

```js
import { Component } from "orbito/lib/component";

export class Header extends Component {
  html() {
    // img/logo.png should live under src/assets/img/logo.png (default assetsPath: src/assets)
    return `<header>
      <img src="${this.asset("img/logo.png")}" alt="Logo" />
    </header>`;
  }
}
```

## Client JS bundle and placeholder

Include `jsPlaceholder` (default `|js|`) once in your root layout; it injects the single bundle that runs `js()` for the whole component tree:

```js
import { Component } from "orbito/lib/component";

export class Page extends Component {
  html() {
    return `
      <html>
        <head>
          <script type="module" defer>
            |js|
          </script>
        </head>
        <body>
          <div>
            <button id="inc">Clicks: <span id="count">0</span></button>
          </div>
        </body>
      </html>
    `;
  }

  js() {
    let n = 0;
    const btn = document.getElementById("inc");
    const count = document.getElementById("count");
    btn?.addEventListener("click", () => {
      n++;
      count.textContent = n;
    });
  }
}
```

`orbito.page` builds a single bundle, injects it at the placeholder, and runs each component’s `js()` on the client. If you omit the placeholder the bundle is generated but not injected.

## Cache

Configure cache with `cacheConfig: { timeInSec, maxSize }` in `new Orbito(...)`. Increase `timeInSec` to keep bundles longer; raise `maxSize` to allow more cached entries.

### Have a good day!
