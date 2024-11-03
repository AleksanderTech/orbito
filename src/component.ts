export class Component {
  components = [];
  assets = [];
  id;

  constructor({ id = `o-${crypto.randomUUID()}` } = {}) {
    this.id = id;
  }

  useComponent(component) {
    const instance = component = typeof component == 'function' ? new component() : component;
    this.components.push(instance);
    return instance;
  }

  asset(assetPath) {
    const id = crypto.randomUUID();
    this.assets.push({ assetPath, id });
    return id;
  }
}
