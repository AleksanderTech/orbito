import { Component } from "../../../orbito/component.js";
import { PageLayout } from "../page-layout.js";
import { Post } from "../post.js";

export class Post2 extends Component {
  static slug = "post-2";
  static postName = "Post 2";

  async html() {
    const marked = await import("marked");

    const content = md`



## Lorem ipsum dolor.

---

> Repellendus nihil dolor dolores soluta **optio** magni

### Corporis tenetur cumque

Natus laborum optio dicta libero ab omnis ad veritatis minus tempore quasi officia [saepe](https://google.com) molestias et, iure iste amet a corrupti eius! Recusandae cupiditate porro velit accusantium placeat, sed fugiat. Fugit, modi a reprehenderit.

### Ab cupiditate veniam iure?

1.  veritatis
2.  laborum
3.  dignissimos

![Robo Image](${this.asset("robots.png")})

**Nulla maiores quam velit quo, culpa perspiciatis atque, molestiae voluptatum aut totam doloribus tempore ad temporibus**



`;

    const post = html` ${this.useComponent(Post).html({ postName: Post2.postName, content: marked.parse(content) })} `;

    return html` ${this.useComponent(PageLayout).html({ title: Post2.slug, content: post })} `;
  }
}
