'use strict';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { POOL_COST } from '../imports/api/constants';
import { handleError } from '../imports/api/global';
import { currentWeek } from '../imports/api/collections/games';
import { getSystemValues } from '../imports/api/collections/systemvals';
import { writeLog } from '../imports/api/collections/nfllogs';

const gmailUrl = Meteor.settings.private.gmail;

const updateUserIfNeeded = (user, field, newValue) => {
	const oldValue = user[field];

	if (oldValue != null && oldValue !== '') return;

	if (newValue == null) return;

	user[field] = newValue;
};

Meteor.startup(() => {

	process.env.MAIL_URL = gmailUrl;

	Meteor.onConnection((conn) => {
		const systemVals = getSystemValues.call({});
		let newConn = {
			opened: new Date(),
			on_view_my_picks: false,
			on_view_all_picks: false,
			scoreboard_open: false,
		};

		systemVals.current_connections[conn.id] = newConn;
		systemVals.save();

		conn.onClose(() => {
			delete systemVals.current_connections[conn.id];

			systemVals.save();
		});
	});

	Accounts.onCreateUser((options, user) => {
		const currWeek = currentWeek.call({});
		const EMPTY_VAL = '';
		let existingUser = Meteor.user();
		let profile = options.profile || {};
		let verified = true;
		let email;
		let firstName;
		let lastName;
		let service;

		if (currWeek > 3) throw new Meteor.Error('Registration has ended', 'No new users are allowed after the third week.  Please try again next year');

		if (user.services.facebook) {
			firstName = user.services.facebook.first_name;
			lastName = user.services.facebook.last_name;
			email = user.services.facebook.email;
			service = 'facebook';
		} else if (user.services.google) {
			firstName = user.services.google.given_name;
			lastName = user.services.google.family_name;
			email = user.services.google.email;
			service = 'google';
		} else {
			firstName = EMPTY_VAL;
			lastName = EMPTY_VAL;
			email = options.email;
			service = 'password';
			verified = false;
		}

		if (!existingUser) existingUser = Meteor.users.findOne({ email });

		if (existingUser) {
			existingUser.services = existingUser.services || {};
			existingUser.services[service] = user.services[service];
			Meteor.users.remove({ _id: existingUser._id });
			user = existingUser;
		}

		updateUserIfNeeded(user, 'profile', profile);
		updateUserIfNeeded(user, 'email', email);
		updateUserIfNeeded(user, 'phone_number', '');
		updateUserIfNeeded(user, 'first_name', firstName);
		updateUserIfNeeded(user, 'last_name', lastName);
		updateUserIfNeeded(user, 'verified', verified);
		updateUserIfNeeded(user, 'done_registering', false);
		updateUserIfNeeded(user, 'is_admin', false);
		updateUserIfNeeded(user, 'notifications', []);
		updateUserIfNeeded(user, 'team_name', EMPTY_VAL);
		updateUserIfNeeded(user, 'referred_by', EMPTY_VAL);
		updateUserIfNeeded(user, 'leagues', []);
		updateUserIfNeeded(user, 'survivor', null);
		updateUserIfNeeded(user, 'payment_type', EMPTY_VAL);
		updateUserIfNeeded(user, 'payment_account', EMPTY_VAL);
		updateUserIfNeeded(user, 'owe', POOL_COST);
		updateUserIfNeeded(user, 'paid', 0);
		updateUserIfNeeded(user, 'selected_week', {});
		updateUserIfNeeded(user, 'total_points', 0);
		updateUserIfNeeded(user, 'total_games', 0);
		updateUserIfNeeded(user, 'overall_place', 1);
		updateUserIfNeeded(user, 'overall_tied_flag', true);

		firstName = firstName || 'An unknown';
		lastName = lastName || 'user';

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
