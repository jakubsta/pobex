
import React, {
  PureComponent,
  Children,
} from 'react';
import PropTypes from 'prop-types';

import { notify } from './pobex';

export class Provider extends PureComponent {

  static childContextTypes = {
    stores: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this._context = { ...props, children: undefined };
  }

  getChildContext() {
    return { stores: this._context };
  }

  render() {
    return Children.only(this.props.children);
  }
}

export function inject(...storesNames) {
  return function (Target) {
    return class extends PureComponent {

      static contextTypes = {
        stores: PropTypes.object.isRequired,
      };

      constructor(props, context) {
        super(props, context);
        this._toPass = storesNames.reduce((acc, storeName) => ({
          ...acc,
          [storeName]: context.stores[storeName],
        }), {});
      }

      render() {
        return <Target {...this._toPass} />;
      }
    };
  };
}

export function observer(target) {
  return class extends target {
    constructor(...args) {
      super(...args);
      this._cancel = notify(this.render.bind(this), this.forceUpdate.bind(this));
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) {
        super.componentWillUnmount();
      }
      this._cancel();
    }
  };
}
