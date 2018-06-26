'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const AdminOnly = ({ authenticated, component, loggingIn, ...rest }) => (
	<Route {...rest} render={(props) => {
		const loggingIn = Meteor.loggingIn();
		const currentUser = Meteor.user();
		const authenticated = !loggingIn && !!currentUser;

		if (loggingIn) return <div></div>;

		return authenticated && currentUser.is_admin ? (
			React.createElement(component, { ...props, loggingIn, authenticated })
		)
			:
			(
				<Redirect to="/" />
			);
	}} />
);

AdminOnly.propTypes = {
	authenticated: PropTypes.bool.isRequired,
	component: PropTypes.func.isRequired,
	loggingIn: PropTypes.bool.isRequired
};

export default AdminOnly;
