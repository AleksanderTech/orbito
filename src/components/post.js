import { Component } from "../../orbito/component.js";

export class Post extends Component {
  html({ postName, content }) {
    return html`
      <h1 class="pt-10 text-center font-bold text-2xl">${postName}</h1>
      <article class="post">${content}</article>
    `;
  }
}
