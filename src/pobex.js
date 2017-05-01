
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

function subscribeMultiple(stores, listener) {
  stores.forEach(({ store, property }) => {
    subscribe(store, property, listener);
  });
}

function unsubscribe(store, property, listener) {
  const storeListeners = listeners.get(store);
  if (storeListeners[property]) {
    storeListeners[property] = storeListeners[property]
      .filter((l) => l !== listener);
  }
}

function unsubscribeMultiple(stores, listener) {
  stores.forEach(({ store, property }) => {
    unsubscribe(store, property, listener);
  });
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

function areTheSameDeps(deps0, deps1) {
  if (deps0.length !== deps1.length) {
    return false;
  }

  return deps0.reduce((acc, d0) =>
    acc && !!deps1.find((d1) =>
      d0.store === d1.store &&
      d0.property === d1.property)
    , true);
}

function getFunctionDeps(f) {
  const prevDeps = deps;
  const prevDepsDetecting = depsDetecting;

  deps = [];
  depsDetecting = true;
  f();

  const newDeps = uniqueDeps(deps);

  deps = prevDeps;
  depsDetecting = prevDepsDetecting;

  return newDeps;
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

function getGetterValue(getter) {
  const prevDepsDetecting = depsDetecting;

  depsDetecting = false;
  const value = getter();
  depsDetecting = prevDepsDetecting;

  return value;
}

function observeGetter(getter, target, key) {
  let deps = getFunctionDeps(getter);

  const onDepChange = () => {
    const newDeps = getFunctionDeps(getter);

    if (!areTheSameDeps(deps, newDeps)) {
      unsubscribeMultiple(deps, onDepChange);
      deps = newDeps;
      subscribeMultiple(deps, onDepChange);
    }

    emit(target, key);
  };

  subscribeMultiple(deps, onDepChange);
}

export function notify(f, callback) {
  const deps = getFunctionDeps(f);
  subscribeMultiple(deps, callback);

  return () => unsubscribeMultiple(deps, callback);
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
            const getter = getGetter(target, key).bind(proxyInstance);

            if (depsDetecting) {
              observeGetter(getter, target, key);
            }

            return getGetterValue(getter);
          }

          return target[key];
        },
      });

      return proxyInstance;
    }

  };
}
