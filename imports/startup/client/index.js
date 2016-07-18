/*jshint esversion: 6 */
'use strict';

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import AppDataContainer from '../../ui/components/AppDataContainer.jsx';

Meteor.startup(() => {
  Deps.autorun(function() {
    Meteor.subscribe('userData');
  });
  render(<AppDataContainer />, document.getElementById('react-root'));
});
