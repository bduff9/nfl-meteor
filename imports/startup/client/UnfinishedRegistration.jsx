'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const UnfinishedRegistration = ({ authenticated, component, loggingIn, ...rest }) => (
	<Route {...rest} render={(props) => {
		const currentUser = Meteor.user(),
				{ done_registering } = currentUser;
		if (loggingIn) return <div></div>;
		return authenticated && !done_registering ? (
			React.createElement(component, { ...props, loggingIn, authenticated })
		)
			:
			(
				<Redirect to="/" />
			);
	}} />
);

UnfinishedRegistration.propTypes = {
	authenticated: PropTypes.bool.isRequired,
	component: PropTypes.func.isRequired,
	loggingIn: PropTypes.bool.isRequired
};

export default UnfinishedRegistration;
