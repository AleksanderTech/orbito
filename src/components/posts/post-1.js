import { Component } from "../../../orbito/component.js";
import { PageLayout } from "../page-layout.js";
import { Post } from "../post.js";

export class Post1 extends Component {
  static slug = "post-1";
  static postName = "Post 1";

  html() {
    const content = html`
      <h2>Lorem ipsum dolor sit amet.</h2>
      <hr />
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Dignissimos quod exercitationem <em>tempore</em> sequi!
        Natus assumenda cum mollitia. <strong>Eius</strong> quos porro nesciunt ex velit qui nobis. Quas a neque voluptatum
        sit?
      </p>
      <h3>Lorem, ipsum.</h3>
      <img src="${this.asset("robot.png")}" alt="Robo Image" />
      <ul>
        <li>neque</li>
        <li>inventore</li>
        <li>quisquam</li>
      </ul>
      <blockquote>
        <p>Aliquid consectetur dolor autem quam possimus expedita sunt natus illo officiis dolores vero tempora</p>
        <p><em>Solirianaus</em></p>
      </blockquote>
    `;

    const post = html`
        ${this.useComponent(Post).html({ postName: Post1.postName, content })}
    `

    return html` ${this.useComponent(PageLayout).html({ title: Post1.slug, content: post })} `;
  }
}
