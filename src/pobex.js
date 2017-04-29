
const listeners = new WeakMap();

let deps = [];
let depsDetecting = false;

function subscribe(store, property, listener) {
  if (!listeners.has(store)) {
    listeners.set(store, {});
  }

  const storeListeners = listeners.get(store);
  if (!storeListeners[property]) {
    storeListeners[property] = [listener];
  } else {
    storeListeners[property].push(listener);
  }
}

function unsubscribe(store, property, listener) {
  const storeListeners = listeners.get(store);
  if (storeListeners[property]) {
    storeListeners[property] = storeListeners[property]
      .filter((l) => l !== listener);
  }
}

function emit(store, property) {
  if (!listeners.has(store)) {
    return;
  }

  const storeListeners = listeners.get(store);
  if (storeListeners[property]) {
    storeListeners[property].forEach(Reflect.apply);
  }
}

function uniqueDeps(deps) {
  return deps
    .filter(({ store, property }, index) =>
      !deps.find((dep, i) => (
        i > index &&
        dep.store === store &&
        dep.property === property)));
}

function getFunctionDeps(f) {
  deps = [];
  depsDetecting = true;
  f();
  depsDetecting = false;

  return uniqueDeps(deps);
}

function getGetter(target, key) {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);

  if (descriptor) {
    return descriptor.get;
  }

  const targetPrototype = Object.getPrototypeOf(target);
  if (targetPrototype !== null) {
    return getGetter(targetPrototype, key);
  }
  return undefined;
}

function isGetter(target, key) {
  return !!getGetter(target, key);
}

export function notify(f, callback) {
  const deps = getFunctionDeps(f);
  deps.forEach(({ store, property }) => {
    subscribe(store, property, callback);
  });

  return () => {
    deps.forEach(({ store, property }) => {
      unsubscribe(store, property, callback);
    });
  };
}

export function autorun(f) {
  return notify(f, f);
}

export function observable(target) {
  return class extends target {

    constructor(...args) {
      super(...args);

      const proxyInstance = new Proxy(this, {
        set(target, key, value) {
          target[key] = value;
          emit(target, key);

          return true;
        },
        get(target, key) {
          if (depsDetecting) {
            deps.push({ store: target, property: key });
          }

          if (isGetter(target, key)) {
            const getter = getGetter(target, key);
            return getter.call(proxyInstance);
          }

          return target[key];
        },
      });

      return proxyInstance;
    }

  };
}
