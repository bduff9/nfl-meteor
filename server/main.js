'use strict';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { POOL_COST } from '../imports/api/constants';
import { handleError } from '../imports/api/global';
import { currentWeek } from '../imports/api/collections/games';
import { getSystemValues } from '../imports/api/collections/systemvals';
import { writeLog } from '../imports/api/collections/nfllogs';

const gmailUrl = Meteor.settings.private.gmail;

Meteor.startup(() => {
	process.env.MAIL_URL = gmailUrl;

	Meteor.onConnection((conn) => {
		const systemVals = getSystemValues.call({});
		let newConn = {
			opened: new Date(),
			on_view_my_picks: false,
			on_view_all_picks: false,
			scoreboard_open: false
		};
		systemVals.current_connections[conn.id] = newConn;
		systemVals.save();
		conn.onClose(() => {
			delete systemVals.current_connections[conn.id];
			systemVals.save();
		});
	});

	Accounts.onCreateUser((options, user) => {
		const currWeek = currentWeek.call({}),
				EMPTY_VAL = '';
		let first_name = EMPTY_VAL,
				last_name = EMPTY_VAL,
				email = EMPTY_VAL,
				verified = true,
				firstName, lastName;
		//TODO: check if existing user, and if so, merge them, else continue on
		//TODO: do we also need to check for someone signed in?
		//TODO: https://forums.meteor.com/t/accounts-password-merge-with-accounts-google-2017-way/35590/2
		if (currWeek > 3) throw new Meteor.Error('Registration has ended', 'No new users are allowed after the third week.  Please try again next year');
		if (user.services.facebook) {
			first_name = user.services.facebook.first_name;
			last_name = user.services.facebook.last_name;
			email = user.services.facebook.email;
		} else if (user.services.google) {
			first_name = user.services.google.given_name;
			last_name = user.services.google.family_name;
			email = user.services.google.email;
		} else {
			email = options.email;
			verified = false;
		}
		user.profile = options.profile || {};
		user.email = email;
		user.phone_number = '';
		user.notifications = [];
		user.first_name = first_name;
		user.last_name = last_name;
		user.team_name = EMPTY_VAL;
		user.referred_by = EMPTY_VAL;
		user.verified = verified;
		user.done_registering = false;
		user.leagues = [];
		user.is_admin = false;
		user.survivor = null;
		user.payment_type = '';
		user.payment_account = '';
		user.owe = POOL_COST;
		user.paid = 0;
		user.selected_week = {};
		user.total_points = 0;
		user.total_games = 0;
		user.overall_place = 1;
		user.overall_tied_flag = true;
		firstName = first_name || 'An unknown';
		lastName = last_name || 'user';
		writeLog.call({ userId: user._id, action: 'REGISTER', message: `${firstName} ${lastName} registered with email ${email}` }, handleError);
		return user;
	});

	Accounts.validateLoginAttempt(({ allowed, methodName, user }) => {
		const currWeek = currentWeek.call({});
		let vEmails;
		if (!allowed || !user) return false;
		if (methodName === 'createUser') {
			Accounts.sendVerificationEmail(user._id);
			return false;
		}
		if (!user.verified) {
			vEmails = user.emails.filter(email => email.verified);
			// Should we also re-send the verification email here?
			if (vEmails.length === 0) throw new Meteor.Error('Email not verified!', 'Please check your email to verify your account');
			Meteor.users.update({ _id: user._id }, { $set: { verified: true }});
			return true;
		}
		if (!user.done_registering && currWeek > 3) throw new Meteor.Error('Registration has ended', 'No new users are allowed after the third week.  Please try again next year');
		return true;
	});
});
