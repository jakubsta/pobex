
import React, { PureComponent } from 'react';
import { mount } from 'enzyme';

import { observable } from '../src/pobex';
import { Provider, inject, observer } from '../src/react';

const prop1DefaultValue = 'prop1';
const prop2DefaultValue = 2;

@observable
class SimpleStore {
  prop1 = prop1DefaultValue;
  prop2 = prop2DefaultValue;
}

describe('Provider and inject', () => {

  @inject('store')
  class SimpleComponent extends PureComponent {
    render() {
      return <span>{this.props.store.prop1}</span>;
    }
  }

  test('should pass store to child', () => {
    const store = new SimpleStore();
    const wrapper = mount(
      <Provider store={store}>
        <SimpleComponent />
      </Provider>);

    expect(wrapper.find('SimpleComponent').prop('store')).toBe(store);
  });
});

describe('observer', () => {

  @observer
  class SimpleComponent extends PureComponent {
    componentWillUnmount() { }

    render() {
      return <span>{this.props.store.prop1}</span>;
    }
  }

  let store = null;
  beforeEach(() => {
    store = new SimpleStore();
  });

  test('should rerender component when its dep change', () => {
    const wrapper = mount(<SimpleComponent store={store} />);

    expect(wrapper.text()).toBe(prop1DefaultValue);

    const prop1NewValue = 'newValue';
    store.prop1 = prop1NewValue;

    expect(wrapper.text()).toBe(prop1NewValue);
    wrapper.unmount();
  });
});
