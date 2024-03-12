import { Component } from "../../orbito/component.js";
import { HomePage } from "./home-page.js";
import { PostsPage } from "./posts-page.js";

export class Header extends Component {
  html({ title }) {
    return html`
      <nav class="text-center p-6 space-x-6 underline">
        <a class="hover:text-blue-500 ${title == HomePage.title ? "text-blue-500" : ""}" href="/">Home</a>
        <a class="hover:text-blue-500 ${title == PostsPage.title ? "text-blue-500" : ""}" href="/posts">Posts</a>
      </nav>
    `;
  }
}
