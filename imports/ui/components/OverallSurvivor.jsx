/*jshint esversion: 6 */
'use strict';

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';

import { SurvivorLayout } from '../layouts/SurvivorLayout.jsx';
import { User } from '../../api/schema';

export default createContainer(({ weekForSec }) => {
  const survivorHandle = Meteor.subscribe('overallSurvivor', weekForSec),
      survivorReady = survivorHandle.ready();
  let data = [];
  if (survivorReady) {
    data = User.find({ "done_registering": true, "survivor.week": { $lte: weekForSec }}, {
      sort: {
        'first_name': 1
      }
    }).fetch();
  }
  return {
    data,
    isOverall: true,
    pageReady: survivorReady,
    weekForSec
  };
}, SurvivorLayout);
