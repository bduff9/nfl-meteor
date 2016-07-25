/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { User } from '../../api/schema';
import getStore from '../../api/store';
import { Routes } from '../../startup/client/routes.jsx';
import { Loading } from '../pages/loading.jsx';

const NFLPool = (props) => {
  const { userLoaded } = props,
      appLoaded = userLoaded || (!Meteor.userId() && !Meteor.loggingIn());
  return (
    <Provider store={getStore()}>
      {appLoaded ? <Routes key={Date.now()} /> : <Loading />}
    </Provider>
  );
};

export default createContainer(() => {
  const userHandle = Meteor.subscribe('userData');
  let userReady = userHandle.ready();
  return {
    userLoaded: userReady,
    user: Meteor.user()
  };
}, NFLPool);
