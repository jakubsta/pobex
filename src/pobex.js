
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

function getFunctionDeps(f) {
  deps = [];
  depsDetecting = true;
  f();
  depsDetecting = false;

  return deps;
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

          return target[key];
        },
      });

      return proxyInstance;
    }

  };
}