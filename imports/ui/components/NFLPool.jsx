/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { User } from '../../api/schema';
import { Routes } from '../../startup/client/Routes.jsx';
import { Loading } from '../pages/Loading.jsx';

const NFLPool = (props) => {
  const { userLoaded } = props,
      appLoaded = userLoaded || (!Meteor.userId() && !Meteor.loggingIn());
  return (
    <div className="row">
      <Helmet
        htmlAttributes={{"lang": "en", "amp": undefined}}
        title="Welcome"
        titleTemplate="%s | NFL Confidence Pool"
        link={[{ rel: 'icon', sizes: '16x16 32x32', href: '/football-icon.png?v=1' }]}
        meta={[{ 'charset': 'utf-8' }, { 'http-equiv': 'X-UA-Compatible', 'content': 'IE=edge' }, { 'name': 'viewport', 'content': 'width=device-width, initial-scale=1, user-scalable=no' }]} />
      {appLoaded ? <Routes key={Date.now()} /> : <Loading />}
    </div>
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
