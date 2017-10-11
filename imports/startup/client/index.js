/* jshint ignore: start */
'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import { render } from 'react-dom';
import Popper from 'popper.js';
import Tether from 'tether';

import NFLPool from '../../ui/components/NFLPool.jsx';

window.Popper = Popper;
window.Tether = Tether;

Meteor.startup(() => {
	render(<NFLPool />, document.getElementById('react-root'));
});
