
import { observable, autorun } from '../src/pobex';

describe('Observing getter(computed value) - dynamic deps', () => {
  const prop1DefaultValue = 1;
  const prop2DefaultValue = 12;
  const prop3DefaultValue = 13;

  @observable
  class SimpleStoreWithGetter {
    prop1 = prop1DefaultValue;
    prop2 = prop2DefaultValue;
    prop3 = prop3DefaultValue;

    get conditionalSum() {
      if (this.prop1 <= 5) {
        return this.prop1 + this.prop2;
      }
      return this.prop1 + this.prop2 + this.prop3;
    }
  }

  let store = null;
  beforeEach(() => {
    store = new SimpleStoreWithGetter();
  });

  test(`should rerun function when any of getter's deps change`, () => {
    const testFunc = jest.fn(() => {
      noop(store.conditionalSum);
    });

    const cancel = autorun(testFunc);

    const prop2NewValue = 20;
    store.prop2 = prop2NewValue;
    expect(testFunc).toHaveBeenCalledTimes(2);
    expect(store.conditionalSum).toBe(prop1DefaultValue + prop2NewValue);

    let prop1NewValue = 5;
    store.prop1 = prop1NewValue;
    expect(testFunc).toHaveBeenCalledTimes(3);
    expect(store.conditionalSum).toBe(prop1NewValue + prop2NewValue);

    prop1NewValue = 10;
    store.prop1 = prop1NewValue;
    expect(testFunc).toHaveBeenCalledTimes(4);
    expect(store.conditionalSum).toBe(prop1NewValue + prop2NewValue + prop3DefaultValue);

    const prop3NewValue = 30;
    store.prop3 = prop3NewValue;
    expect(testFunc).toHaveBeenCalledTimes(5);
    expect(store.conditionalSum).toBe(prop1NewValue + prop2NewValue + prop3NewValue);

    cancel();
  });
});

function noop() {}
