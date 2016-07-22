/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import getStore from '../../api/store';
import { Session } from 'meteor/session';

import { Routes } from '../../startup/client/routes.jsx';
import { Loading } from '../pages/loading.jsx';

const AppData = (props) => {
  const { currentWeek, user } = props,
      doneLoading = user !== undefined;
console.log('currentWeek', currentWeek);
console.log('session', Session.get('selectedWeek'));
  Session.set('currentWeek', currentWeek);
  if (currentWeek) Session.setDefault('selectedWeek', currentWeek);
  return (
    <Provider store={getStore()}>
      {doneLoading ? <Routes key={Date.now()} /> : <Loading />}
    </Provider>
  );
};

export default AppData;