'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';

import { Loading } from '../pages/Loading';
import { handleError } from '../../api/global';

const VerifyEmail = ({ authenticated, history, loggingIn, match }) => {

	if (authenticated) {
		history.replace('/');
	} else if (!loggingIn) {
		Accounts.verifyEmail(match.params.token, err => {
			if (err) {
				handleError(err);
			} else {
				Bert.alert('Your email is now verified!', 'success');
				history.replace('/users/create');
			}
		});
	}

	return <Loading />;
};

VerifyEmail.propTypes = {
	history: PropTypes.object.isRequired,
	match: PropTypes.object.isRequired
};

export default withRouter(VerifyEmail);
