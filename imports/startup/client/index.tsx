import { Meteor } from 'meteor/meteor';
import React from 'react';
import { render } from 'react-dom';

import NFLPool from '../../ui/components/NFLPool';

import './fontawesome';

Meteor.startup((): void => {
	render(<NFLPool />, document.getElementById('react-root'));
});
