'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const Unauthenticated = ({ component, location, ...rest }) => (
	<Route {...rest} render={props => {
		const { state = {} } = location,
				{ nextPathname } = state,
				currentUser = Meteor.user(),
				loggingIn = Meteor.loggingIn(),
				authenticated = !loggingIn && !!currentUser;
		console.log({ loggingIn, authenticated, component, location, rest });
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
	component: PropTypes.func,
	location: PropTypes.object
};

export default Unauthenticated;
