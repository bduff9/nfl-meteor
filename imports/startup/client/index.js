/*jshint esversion: 6 */
'use strict';

import React from 'react';
import { render } from 'react-dom';

import NFLPool from '../../ui/components/NFLPool.jsx';

Meteor.startup(() => {
  render(<NFLPool />, document.getElementById('react-root'));
});
