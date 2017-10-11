'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const UnfinishedRegistration = ({ loggingIn, authenticated, component, ...rest }) => (
	<Route {...rest} render={(props) => {
		const { done_registering } = Meteor.user();
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
	loggingIn: PropTypes.bool,
	authenticated: PropTypes.bool,
	component: PropTypes.func,
};

export default UnfinishedRegistration;
