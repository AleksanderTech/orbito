import { Component } from "../../orbito/component.js";

export class Footer extends Component {
    html() {
        return html`
            <footer class="sticky top-full p-6 text-center">
                <span>&copy; ${new Date().getFullYear()} Blog</span>
            </footer>
        `
    }
}