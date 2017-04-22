import { observable, autorun } from '../src/pobex';

describe('Observing simple properties', () => {
  const prop1DefaultValue = 'QwertY';
  const prop2DefaultValue = 12;

  @observable
  class SimpleStore {
    prop1 = prop1DefaultValue;
    prop2 = prop2DefaultValue;
  }

  let store = null;
  beforeEach(() => {
    store = new SimpleStore();
  });

  test('should behave like a normal object', () => {
    expect(store).toBeInstanceOf(SimpleStore);
    expect(store.prop1).toBe(prop1DefaultValue);

    const newValue = 'test0';
    store.prop1 = newValue;

    expect(store.prop1).toBe(newValue);
  });

  test('should rerun function when its dep change', () => {
    const testFunc = jest.fn(() => {
      noop(store.prop1);
    });

    const cancel = autorun(testFunc);
    store.prop1 = 'test1';
    expect(testFunc).toHaveBeenCalledTimes(2);

    cancel();
  });

  test('should rerun function when any of its dep change', () => {
    const testFunc = jest.fn(() => {
      noop(store.prop1, store.prop2);
    });

    const cancel = autorun(testFunc);
    store.prop1 = 'test1';
    expect(testFunc).toHaveBeenCalledTimes(2);
    store.prop2 = 77;
    expect(testFunc).toHaveBeenCalledTimes(3);

    cancel();
  });

  test(`shouldn't rerun function when its dep no change`, () => {
    const testFunc = jest.fn(() => {
      noop(store.prop1);
    });

    const cancel = autorun(testFunc);
    store.prop2 = 99;
    expect(testFunc).toHaveBeenCalledTimes(1);

    cancel();
  });

  test('should work with multiple subscribers', () => {
    const testFunc0 = jest.fn(() => {
      noop(store.prop1);
    });

    const testFunc1 = jest.fn(() => {
      noop(store.prop1, store.prop2);
    });

    const cancel0 = autorun(testFunc0);
    const cancel1 = autorun(testFunc1);

    store.prop1 = '___';
    expect(testFunc0).toHaveBeenCalledTimes(2);
    expect(testFunc1).toHaveBeenCalledTimes(2);

    store.prop2 = 73;
    expect(testFunc0).toHaveBeenCalledTimes(2);
    expect(testFunc1).toHaveBeenCalledTimes(3);

    cancel0();
    cancel1();
  });

  test('should work with multiple stores', () => {
    const secondStore = new SimpleStore();

    const testFunc = jest.fn(() => {
      noop(store.prop2 + secondStore.prop2);
    });

    const cancel = autorun(testFunc);
    store.prop2 = 11;
    secondStore.prop2 = 12;
    expect(testFunc).toHaveBeenCalledTimes(3);

    cancel();
  });

  test(`shouldn't rerun function after clear`, () => {
    const testFunc = jest.fn(() => {
      noop(store.prop1);
    });

    const cancel = autorun(testFunc);

    store.prop1 = 'beforeCancel';
    expect(testFunc).toHaveBeenCalledTimes(2);

    cancel();

    store.prop1 = 'afterCancel';
    expect(testFunc).toHaveBeenCalledTimes(2);
  });
});

function noop() {}
