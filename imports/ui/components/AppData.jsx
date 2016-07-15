/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import getStore from '../../api/store';

import { Routes } from '../../startup/client/routes.jsx';
import { Loading } from '../pages/loading.jsx';

const AppData = (props) => {
  const doneLoading = props.user !== undefined;
  return (
    <Provider store={getStore()}>
      {doneLoading ? <Routes key={Date.now()} /> : <Loading />}
    </Provider>
  );
};

export default AppData;