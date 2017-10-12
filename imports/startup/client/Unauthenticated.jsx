'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const Unauthenticated = ({ authenticated, component, location, ...rest }) => (
	<Route {...rest} render={props => {
		const { state = {} } = location,
				{ nextPathname } = state,
				loggingIn = Meteor.loggingIn();
		return !authenticated ? (
			React.createElement(component, { ...props, location, loggingIn, authenticated })
		)
			:
			(
				<Redirect to={{ pathname: nextPathname || '/', state: {} }} />
			);
	}} />
);

Unauthenticated.propTypes = {
	authenticated: PropTypes.bool,
	component: PropTypes.func,
	location: PropTypes.object
};

export default Unauthenticated;
