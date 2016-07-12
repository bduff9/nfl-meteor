/*jshint esversion: 6 */
'use strict';

import { combineReducers } from 'redux';

import * as Actions from './actions';
import * as Constants from './constants';

function picks(state = [], action) {
  const { type, payload } = action;
  switch(type) {
  default:
    return state;
  }
}

const rootReducer = combineReducers({
  picks
});

const appReducers = (state, action) => {
  return rootReducer(state, action);
};

export default appReducers;