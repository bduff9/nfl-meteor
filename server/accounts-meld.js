'use strict';

import { Meteor } from 'meteor/meteor';
import { AccountsMeld } from 'meteor/splendido:accounts-meld';

import { logError } from '../imports/api/global';
import { migrateLogEntriesForUser } from '../imports/api/collections/nfllogs';

const meldUserCallback = (origUser, newUser) => {
	const meldedUser = Object.assign({}, newUser, origUser);
	return meldedUser;
};

const meldDBCallback = (origUserId, newUserId) => {
	migrateLogEntriesForUser.call({ oldUserID: origUserId, newUserId }, logError);
};

const serviceAddedCallback = (userId, serviceName) => {
	const user = Meteor.users.findOne(userId);
	let firstName = user.first_name,
			lastName = user.last_name,
			fullName = user.profile && user.profile.name;
	if (serviceName === 'facebook') {
		firstName = firstName || user.services.facebook.first_name;
		lastName = lastName || user.services.facebook.last_name;
		fullName = fullName || `${firstName} ${lastName}`;
	} else if (serviceName === 'google') {
		firstName = firstName || user.services.google.given_name;
		lastName = lastName || user.services.google.family_name;
		fullName = fullName || `${firstName} ${lastName}`;
	}
	Meteor.users.update(userId, { $set: { first_name: firstName, last_name: lastName, 'profile.name': fullName }});
};

AccountsMeld.configure({
	askBeforeMeld: false,
	checkForConflictingServices: false,
	meldUserCallback,
	meldDBCallback,
	serviceAddedCallback
});
