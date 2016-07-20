/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { User } from '../../api/schema';
import AppData from './AppData.jsx';

export default createContainer(() => {
  Deps.autorun(function() {
    Meteor.subscribe('userData');
  });
  return {
    user: Meteor.user()
  };
}, AppData);