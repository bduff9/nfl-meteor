import { Meteor } from 'meteor/meteor';
import React from 'react';
import { render } from 'react-dom';

import NFLPool from '../../ui/components/NFLPool';

import './fontawesome';

if (process.env.NODE_ENV !== 'production') {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const whyDidYouRender = require('@welldone-software/why-did-you-render');

	whyDidYouRender(React);
}

Meteor.startup(
	(): void => {
		render(<NFLPool />, document.getElementById('react-root'));
	},
);
