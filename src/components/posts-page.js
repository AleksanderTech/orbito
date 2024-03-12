import { Component } from "../../orbito/component.js";
import { PageLayout } from "./page-layout.js";

export class PostsPage extends Component {
  static title = "Posts";

  constructor(posts) {
    super();
    this.posts = posts;
  }

  html() {
    const content = html`
      <ul class="underline space-y-6 text-center p-10">
        ${this.posts.map((post) => `<li><a class="hover:text-blue-500" href="${post.slug}">${post.postName}</a></li>`).join("")}
      </ul>
    `;

    return html` ${this.useComponent(PageLayout).html({ title: PostsPage.title, content })} `;
  }

  js() {
    //
  }
}
