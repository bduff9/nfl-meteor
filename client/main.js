'use strict';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Session } from 'meteor/session';

import '/imports/ui/pages/main.html';
import '/imports/startup/client';
import 'bootstrap';

import { handleError } from '../imports/api/global';
import { currentWeek } from '../imports/api/collections/games';
import { writeLog } from '../imports/api/collections/nfllogs';

Meteor.startup(() => {

	Accounts.onLogin(() => {
		const user = Meteor.user();

		if (user.first_name && user.last_name) writeLog.call({ userId: user._id, action: 'LOGIN', message: `${user.first_name} ${user.last_name} successfully signed in` }, handleError);

		currentWeek.call((err, week) => {
			if (err) {
				handleError(err);
			} else {
				Session.set('currentWeek', week);
			}
		});
	});
});
