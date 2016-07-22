/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { User } from '../../api/schema';
import AppData from './AppData.jsx';
import { currentWeek } from '../../api/collections/games';
import { displayError } from '../../api/global';

export default createContainer(() => {
  const userHandle = Meteor.subscribe('userData'),
      gameHandle = Meteor.subscribe('allGames'),
      gamesReady = gameHandle.ready();
  return {
    user: Meteor.user(),
    currentWeek: gamesReady ? currentWeek.call(displayError) : false
  };
}, AppData);
