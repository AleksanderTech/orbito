import { Component } from "../../orbito/component.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";

export class PageLayout extends Component {
  html({ title, content }) {
    return html`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title}</title>
          <link href="${this.asset("style.css")}" rel="stylesheet" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <script type="module">|js|</script>
        </head>
        <body class="min-h-[100dvh]">
          ${this.useComponent(Header).html({ title })}
          ${content}
          ${this.useComponent(Footer).html()}
        </body>
      </html>
    `;
  }
}
