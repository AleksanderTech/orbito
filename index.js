import { Orbito } from "./orbito/orbito.js";
import { HomePage } from "./src/components/home-page.js";
import { PostsPage } from "./src/components/posts-page.js";
import { tailwindCss } from "./orbito/orbito-integrations.js";

const orbito = new Orbito({
  componentsPath: "src/components",
  assetsPath: "assets",
  integrations: { tailwindCss: tailwindCss("assets/style.css") },
  publicPath: "public",
  jsPlaceholder: "|js|"
});

const posts = await orbito.pages("posts");

for (let post of posts) {
  await orbito.page({
    component: post.componentClass,
    filePath: `posts/${post.filename}`,
    route: post.componentClass.slug,
  });
}

await orbito.page({ component: HomePage, filePath: "home-page.js", route: "/" });

await orbito.page({
  component: new PostsPage(posts.map((post) => ({ slug: post.componentClass.slug, postName: post.componentClass.postName }))),
  filePath: "posts-page.js",
  route: "/posts",
});
