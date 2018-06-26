'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const Authenticated = ({ authenticated, component, location, loggingIn, ...rest }) => (
	<Route {...rest} render={props => {
		const { pathname } = location;
		const currentUser = Meteor.user();

		console.log('authenticated');

		if (loggingIn) return <div></div>;

		if (pathname !== '/users/create' && authenticated && !currentUser.done_registering) return (<Redirect to="/users/create" />);

		return authenticated ? (
			React.createElement(component, { ...props, location, loggingIn, authenticated })
		)
			:
			(
				<Redirect to={{ pathname: '/login', state: { nextPathname: location.pathname }}} />
			);
	}} />
);

Authenticated.propTypes = {
	authenticated: PropTypes.bool.isRequired,
	component: PropTypes.func.isRequired,
	location: PropTypes.object,
	loggingIn: PropTypes.bool.isRequired
};

export default Authenticated;
