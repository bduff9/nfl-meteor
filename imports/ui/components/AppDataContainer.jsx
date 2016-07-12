/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import AppData from './AppData.jsx';

export default createContainer(() => {
  return {
    user: Meteor.user()
  };
}, AppData);