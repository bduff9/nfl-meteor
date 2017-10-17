'use strict';

import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Helmet from 'react-helmet';
import { Session } from 'meteor/session';

import { handleError } from '../../api/global';
import { writeLog } from '../../api/collections/nfllogs';
import { removeSelectedWeek } from '../../api/collections/users';

class Logout extends Component {
	constructor () {
		super();
		this.state = {};
	}

	componentDidMount () {
		const user = Meteor.user(),
				userId = Meteor.userId();
		if (userId) {
			removeSelectedWeek.call({ userId });
			Meteor.logout(err => {
				writeLog.call({ userId, action: 'LOGOUT', message: `${user.first_name} ${user.last_name} successfully signed out` }, handleError);
				Object.keys(Session.keys).forEach(key => Session.set(key, undefined));
				Session.keys = {};
			});
		}
	}

	render () {
		return (
			<div className="white-box col-11 col-sm-10 col-md-6 col-xl-4 logout-box">
				<Helmet title="Logged Out" />
				<div className="row">
					<div className="text-center col">
						<h3>You have been successfully logged out</h3>
					</div>
				</div>
				<div className="row">
					<div className="text-center col">
						<NavLink to="/login">Return to Sign-in</NavLink>
					</div>
				</div>
			</div>
		);
	}
}

Logout.propTypes = {};

export default Logout;
