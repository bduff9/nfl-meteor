/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import getStore from '../../api/store';

import { Routes } from '../../startup/client/routes.jsx';
import { Loading } from '../pages/loading.jsx';

const AppData = (props) => {
  const { userLoaded } = props;
  return (
    <Provider store={getStore()}>
      {userLoaded ? <Routes key={Date.now()} /> : <Loading />}
    </Provider>
  );
};

export default AppData;