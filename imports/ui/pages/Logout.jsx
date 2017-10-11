'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import { NavLink } from 'react-router-dom';
import Helmet from 'react-helmet';
import { Session } from 'meteor/session';

import { handleError } from '../../api/global';
import { removeSelectedWeek } from '../../api/collections/users';
import { writeLog } from '../../api/collections/nfllogs';

const Logout = () => {

	const user = Meteor.user();
	if (Meteor.userId()) {
		removeSelectedWeek.call({ userId: user._id }, handleError);
		Meteor.logout((err) => {
			writeLog.call({ userId: user._id, action: 'LOGOUT', message: `${user.first_name} ${user.last_name} successfully signed out` }, handleError);
			Object.keys(Session.keys).forEach(key => Session.set(key, undefined));
			Session.keys = {};
		});
	}

	return (
		<div className="row">
			<Helmet title="Logged Out" />
			<div className="white-box col-xs-11 col-sm-10 col-md-6 col-xl-4 logout-box">
				<div className="row">
					<div className="text-xs-center col-xs-12">
						<h3>You have been successfully logged out</h3>
					</div>
				</div>
				<div className="row">
					<div className="text-xs-center col-xs">
						<NavLink to="/login">Return to Sign-in</NavLink>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Logout;
