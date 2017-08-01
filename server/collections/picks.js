'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Pick } from '../../imports/api/collections/picks';

export const addPick = new ValidatedMethod({
	name: 'Picks.addPick',
	validate: new SimpleSchema({
		pick: { type: Object, label: 'Pick', blackbox: true }
	}).validator(),
	run ({ pick }) {
		const newPick = new Pick(pick);
		newPick.save();
	}
});
export const addPickSync = Meteor.wrapAsync(addPick.call, addPick);

export const clearPicks = new ValidatedMethod({
	name: 'Picks.clearPicks',
	validate: new SimpleSchema({}).validator(),
	run () {
		Pick.remove({}, { multi: true });
	}
});
export const clearPicksSync = Meteor.wrapAsync(clearPicks.call, clearPicks);

export const removeAllPicksForUser = new ValidatedMethod({
	name: 'Picks.removeAllPicksForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League', optional: true },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ league, user_id }) {
		if (Meteor.isServer) Pick.remove({ league, user_id }, { multi: true });
	}
});
export const removeAllPicksForUserSync = Meteor.wrapAsync(removeAllPicksForUser.call, removeAllPicksForUser);

export const removeBonusPointPicks = new ValidatedMethod({
	name: 'Games.removeBonusPointPicks',
	validate: new SimpleSchema({}).validator(),
	run () {
		if (Meteor.isServer) Pick.remove({ game: 0 }, { multi: true });
	}
});
export const removeBonusPointPicksSync = Meteor.wrapAsync(removeBonusPointPicks.call, removeBonusPointPicks);
