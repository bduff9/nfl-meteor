/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import getStore from '../../api/store';

import { Routes } from '../../startup/client/routes.jsx';

const AppData = (props) => {
  const doneLoading = props.user !== undefined;
  return (
    <Provider store={getStore()}>
      {doneLoading ? <Routes key={Date.now()} /> : <i className="fa fa-spinner fa-pulse" />}
    </Provider>
  );
};

export default AppData;