/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Sortable from 'sortablejs';
import _ from 'lodash';

const defaultOptions = {
  /*ref: 'list',
  model: 'items',
  onStart: 'handleStart',
  onEnd: 'handleEnd',
  onAdd: 'handleAdd',
  onUpdate: 'handleUpdate',
  onRemove: 'handleRemove',
  onSort: 'handleSort',
  onFilter: 'handleFilter',
  onMove: 'handleMove'*/
};

let _nextSibling = null,
    _activeComponent = null;

const getModelName = (component) => {
  let { sortableOptions = {} } = component.props,
      { model } = sortableOptions;
  return model || defaultOptions.model;
};

const getModelItems = (component) => {
  let model = getModelName(component),
      { state = {}, props = {} } = component,
      items = state[model] || props[model] || [];
  return items.slice();
};

class Draggable extends Component {
  componentDidMount() {
    const options = _.merge({}, defaultOptions, this.props.sortableOptions),
        emitEvent = (type, evt) => {
          const method = options[type],
              result = method && method.call(this, evt, this._sortableInstance);
          if (!method) return true;
          return result;
        };
    let copyOptions = _.extend({}, options),
        domNode;
    // Bind callbacks so that 'this' refers to the component
    [
      'onStart', 'onEnd', 'onAdd', 'onSort', 'onUpdate', 'onRemove', 'onFilter', 'onMove'
    ].forEach(name => {
      copyOptions[name] = (evt) => {
        let newState, remoteState, oldIndex, newIndex, items, remoteItems, item;
        if (name === 'onStart') {
          _nextSibling = evt.item.nextElementSibling;
          _activeComponent = this;
        } else if (name === 'onAdd' || name === 'onUpdate') {
          evt.from.insertBefore(evt.item, _nextSibling);
          newState = {};
          remoteState = {};
          oldIndex = evt.oldIndex;
          newIndex = evt.newIndex;
          items = getModelItems(this);
          if (name === 'onAdd') {
            remoteItems = getModelItems(_activeComponent);
            item = remoteItems.splice(oldIndex, 1)[0];
            items.splice(newIndex, 0, item);
            remoteState[getModelName(_activeComponent)] = remoteItems;
          } else {
            items.splice(newIndex, 0, items.splice(oldIndex, 1)[0]);
          }
          newState[getModelName(this)] = items;
          if (copyOptions.stateHandler) {
            this[copyOptions.stateHandler](newState);
          } else {
            this.setState(newState);
          }
          (this !== _activeComponent) && _activeComponent.setState(remoteState);
        }
        //setTimeout(() =>
        return emitEvent(name, evt);//, 0);
      };
    });
    domNode = ReactDOM.findDOMNode(this.refs[options.ref] || this);
    this._sortableInstance = Sortable.create(domNode, copyOptions);
  }
  componentWillReceiveProps(nextProps) {
    let newState = {},
        model = getModelName(this),
        items = nextProps[model];
    if (items) {
      newState[model] = items;
      this.setState(newState);
    }
  }
  componentWillUnmount() {
    this._sortableInstance.destroy();
    this._sortableInstance = null;
  }
}

Draggable._sortableInstance = null;

export default Draggable;
