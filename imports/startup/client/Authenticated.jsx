'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const Authenticated = ({ component, location, ...rest }) => (
	<Route {...rest} render={props => {
		const { pathname } = location,
				loggingIn = Meteor.loggingIn(),
				currentUser = Meteor.user(),
				authenticated = !loggingIn && !!currentUser;
		console.log({ authenticated, loggingIn, currentUser, component, location, rest });
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
	component: PropTypes.func.isRequired,
	location: PropTypes.object
};

export default Authenticated;
