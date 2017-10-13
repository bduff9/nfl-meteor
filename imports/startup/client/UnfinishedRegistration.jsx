'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const UnfinishedRegistration = ({ component, ...rest }) => (
	<Route {...rest} render={(props) => {
		const currentUser = Meteor.user(),
				{ done_registering } = currentUser,
				loggingIn = Meteor.loggingIn(),
				authenticated = !loggingIn && !!currentUser;
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
	component: PropTypes.func
};

export default UnfinishedRegistration;
