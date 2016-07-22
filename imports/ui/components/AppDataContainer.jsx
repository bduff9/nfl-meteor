/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

import { User } from '../../api/schema';
import AppData from './AppData.jsx';

//TODO combine this and AppData
//TODO remove game sub from here and move to App
export default createContainer(() => {
  const userHandle = Meteor.subscribe('userData'),
      userReady = userHandle.ready();
  Meteor.subscribe('allGames');
  return {
    userLoaded: userReady,
    currentWeek: Session.get('currentWeek'),
    selectedWeek: Session.get('selectedWeek')
  };
}, AppData);