/*jshint esversion: 6 */
'use strict';

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';

import { SurvivorLayout } from '../layouts/SurvivorLayout.jsx';
import { User } from '../../api/schema';

export default createContainer(({ week, weekForSec }) => {
  const survivorHandle = Meteor.subscribe('weekSurvivor', week),
      survivorReady = survivorHandle.ready();
  let data = [];
  if (survivorReady) {
    data = User.find({ "survivor.week": week }, {
      sort: {
        'first_name': 1
      }
    }).fetch();
  }
  return {
    data,
    isOverall: false,
    pageReady: survivorReady,
    week,
    weekForSec
  };
}, SurvivorLayout);
