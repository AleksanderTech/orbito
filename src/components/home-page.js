import { Component } from "../../orbito/component.js";
import { PageLayout } from "./page-layout.js";

export class HomePage extends Component {
    static title = 'Home';

  html() {
    const content = html`
        <h1 class="text-center p-10">Welcome Home.</h1>
        <img class="m-auto border-t" src="${this.asset("orbito.png")}" alt="Orbito Image">
    `;

    return html`
        ${this.useComponent(PageLayout).html({ title: HomePage.title, content  })}
    `;
  }

  js() {
    console.log("Welcome Home.")
  }
}
