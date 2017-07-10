'use strict';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { currentWeekSync, getEmptyUserPicksSync, getEmptyUserSurvivorPicksSync, getEmptyUserTiebreakersSync } from '../imports/api/collections/games';
import { getSystemValuesSync } from '../imports/api/collections/systemvals';
import { writeLogSync } from '../imports/api/collections/nfllogs';

const gmailUrl = Meteor.settings.private.gmail;

Meteor.startup(() => {
	process.env.MAIL_URL = gmailUrl;

	Meteor.onConnection((conn) => {
		const systemVals = getSystemValuesSync();
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
		const currWeek = currentWeekSync(),
				EMPTY_VAL = '';
		let first_name = EMPTY_VAL,
				last_name = EMPTY_VAL,
				email = EMPTY_VAL,
				verified = true,
				firstName, lastName;
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
		user.first_name = first_name;
		user.last_name = last_name;
		user.email = email;
		user.team_name = EMPTY_VAL;
		user.referred_by = EMPTY_VAL;
		user.verified = verified;
		user.done_registering = false;
		user.paid = false;
		user.selected_week = {};
		user.total_points = 0;
		user.total_games = 0;
		user.picks = getEmptyUserPicksSync();
		user.tiebreakers = getEmptyUserTiebreakersSync();
		user.survivor = getEmptyUserSurvivorPicksSync();
		firstName = first_name || 'An unknown';
		lastName = last_name || 'user';
		writeLogSync({ userId: user._id, action: 'REGISTER', message: `${firstName} ${lastName} registered with email ${email}` });
		return user;
	});

	Accounts.validateLoginAttempt((parms) => {
		const { methodName, user } = parms;
		let vEmails;
		if (methodName === 'createUser' && parms.user) {
			Accounts.sendVerificationEmail(parms.user._id);
			return false;
		}
		if (user && !user.verified) {
			vEmails = user.emails.filter(email => email.verified);
			// Should we also re-send the verification email here?
			if (vEmails.length === 0) throw new Meteor.Error('Email not verified!', 'Please check your email to verify your account');
			Meteor.users.update({ _id: user._id }, { $set: { verified: true }});
		}
		return true;
	});
});
