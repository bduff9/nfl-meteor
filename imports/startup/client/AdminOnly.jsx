'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const AdminOnly = ({ component, ...rest }) => (
	<Route {...rest} render={(props) => {
		const loggingIn = Meteor.loggingIn(),
				currentUser = Meteor.user(),
				authenticated = !loggingIn && !!currentUser;
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
	component: PropTypes.func
};

export default AdminOnly;
