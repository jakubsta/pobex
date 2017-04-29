
import { observable, autorun } from '../src/pobex';

describe('Observing getter(computed value)', () => {
  const prop1DefaultValue = 11;
  const prop2DefaultValue = 12;

  @observable
  class SimpleStoreWithGetter {
    prop1 = prop1DefaultValue;
    prop2 = prop2DefaultValue;

    get sum() {
      return this.prop1 + this.prop2;
    }
  }

  let store = null;
  beforeEach(() => {
    store = new SimpleStoreWithGetter();
  });

  test(`should rerun function when any of getter's deps change`, () => {
    const testFunc = jest.fn(() => {
      noop(store.sum);
    });

    const cancel = autorun(testFunc);
    store.prop1 = 20;
    expect(testFunc).toHaveBeenCalledTimes(2);
    store.prop2 = 1;
    expect(testFunc).toHaveBeenCalledTimes(3);

    cancel();

  });
});

function noop() {}
