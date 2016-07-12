/*jshint esversion: 6 */
'use strict';

import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import createSagaMiddleware from 'redux-saga';

import appReducers from './reducers';
import allSagas from './sagas';

let store = null;

export default function getStore() {
  if (store == null) {
    const loggerMiddleware = createLogger();
    const sagaMiddleware = createSagaMiddleware();
    store = createStore(appReducers, applyMiddleware(loggerMiddleware, sagaMiddleware));
    sagaMiddleware.run(allSagas);
  }
  return store;
}