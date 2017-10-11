'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const AdminOnly = ({ loggingIn, authenticated, component, ...rest }) => (
	<Route {...rest} render={(props) => {
		const currentUser = Meteor.user();
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
	loggingIn: PropTypes.bool,
	authenticated: PropTypes.bool,
	component: PropTypes.func,
};

export default AdminOnly;
