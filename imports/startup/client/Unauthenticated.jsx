'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const Unauthenticated = ({ authenticated, component, location, loggingIn, ...rest }) => (
	<Route {...rest} render={props => {
		const { state = {} } = location,
				{ nextPathname } = state;
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
	authenticated: PropTypes.bool.isRequired,
	component: PropTypes.func.isRequired,
	location: PropTypes.object,
	loggingIn: PropTypes.bool.isRequired
};

export default Unauthenticated;
