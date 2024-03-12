export class Component {
  components = [];
  assets = [];

  constructor({ id = `o-${crypto.randomUUID()}` } = {}) {
    this.id = id;
  }

  useComponent(component) {
    const instance = component instanceof Component ? component : new component();
    this.components.push(instance);
    return instance;
  }

  asset(assetPath) {
    const id = crypto.randomUUID();
    this.assets.push({ assetPath, id });
    return id;
  }
}
