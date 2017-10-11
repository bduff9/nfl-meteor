'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';

import { Loading } from '../pages/Loading';
import { handleError } from '../../api/global';

const VerifyEmail = ({ match }, { router }) => {
	if (Meteor.userId()) {
		router.push('/');
	} else {
		Accounts.verifyEmail(match.params.token, err => {
			if (err) {
				handleError(err);
			} else {
				Bert.alert('Your email is now verified!', 'success');
				router.push('/users/create');
			}
		});
	}
	return <Loading />;
};

VerifyEmail.contextTypes = {
	router: PropTypes.object.isRequired
};

VerifyEmail.propTypes = {
	match: PropTypes.object.isRequired
};

export default VerifyEmail;
