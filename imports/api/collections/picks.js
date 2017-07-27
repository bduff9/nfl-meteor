'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../../api/constants';
import { displayError } from '../../api/global';
import { gameHasStarted } from './games';
import { getTeamByID } from './teams';

/**
 * All pick logic
 * @since 2017-06-26
 */

export const getAllPicks = new ValidatedMethod({
	name: 'Picks.getAllPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' }
	}).validator(),
	run ({ league }) {
		const user_id = this.userId;
		const picks = Pick.find({ league }, { sort: { user_id: 1, week: 1, game: 1 } }).fetch();
		if (!user_id) throw new Meteor.Error('You are not signed in!');
		if (!picks) throw new Meteor.Error('No picks found');
		return picks;
	}
});
export const getAllPicksSync = Meteor.wrapAsync(getAllPicks.call, getAllPicks);

export const getAllPicksForWeek = new ValidatedMethod({
	name: 'Picks.getAllPicksForWeek',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const user_id = this.userId;
		const picks = Pick.find({ league, week }, { sort: { user_id: 1, game: 1 } }).fetch();
		if (!user_id) throw new Meteor.Error('You are not signed in!');
		if (!picks) throw new Meteor.Error(`No picks found for week ${week}`);
		return picks;
	}
});
export const getAllPicksForWeekSync = Meteor.wrapAsync(getAllPicksForWeek.call, getAllPicksForWeek);

export const getPicksForWeek = new ValidatedMethod({
	name: 'Picks.getPicksForWeek',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const user_id = this.userId;
		const picks = Pick.find({ league, user_id, week }, { sort: { game: 1 } }).fetch();
		if (!user_id) throw new Meteor.Error('You are not signed in!');
		if (!picks) throw new Meteor.Error(`No picks found for week ${week}`);
		return picks;
	}
});
export const getPicksForWeekSync = Meteor.wrapAsync(getPicksForWeek.call, getPicksForWeek);

export const migratePicksForUser = new ValidatedMethod({
	name: 'Picks.migratePicksForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' }
	}).validator(),
	run ({ newUserId, oldUserId }) {
		Pick.update({ user_id: oldUserId }, { $set: { user_id: newUserId }}, { multi: true });
	}
});
export const migratePicksForUserSync = Meteor.wrapAsync(migratePicksForUser.call, migratePicksForUser);

export const setPick = new ValidatedMethod({
	name: 'Picks.add',
	validate: new SimpleSchema({
		addOnly: { type: Boolean, label: 'Add Only' },
		fromData: { type: Object, label: 'From List' },
		'fromData.gameId': { type: String, label: 'From Game ID', optional: true },
		'fromData.teamId': { type: String, label: 'From Team ID', optional: true },
		'fromData.teamShort': { type: String, label: 'From Team Name', optional: true },
		league: { type: String, label: 'League' },
		pointVal: { type: Number, label: 'Points' },
		removeOnly: { type: Boolean, label: 'Remove Only' },
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
		toData: { type: Object, label: 'To List' },
		'toData.gameId': { type: String, label: 'To Game ID', optional: true },
		'toData.teamId': { type: String, label: 'To Team ID', optional: true },
		'toData.teamShort': { type: String, label: 'To Team Name', optional: true }
	}).validator(),
	run ({ addOnly, fromData, league, pointVal, removeOnly, selectedWeek, toData }) {
		let pick;
		if (!this.userId) throw new Meteor.Error('Users.picks.set.notLoggedIn', 'Must be logged in to update picks');
		if (fromData.gameId && gameHasStarted.call({ gameId: fromData.gameId }, displayError)) throw new Meteor.Error('Users.picks.set.gameAlreadyStarted', 'This game has already begun');
		if (toData.gameId && gameHasStarted.call({ gameId: toData.gameId }, displayError)) throw new Meteor.Error('Users.picks.set.gameAlreadyStarted', 'This game has already begun');
		if (Meteor.isServer) {
			if (!addOnly && fromData.gameId !== toData.gameId) {
				pick = Pick.findOne({ game_id: fromData.gameId, league: league, user_id: this.userId, week: selectedWeek });
				pick.pick_id = undefined;
				pick.pick_short = undefined;
				pick.points = undefined;
				pick.save();
			}
			if (!removeOnly) {
				pick = Pick.findOne({ game_id: toData.gameId, league: league, user_id: this.userId, week: selectedWeek });
				pick.pick_id = toData.teamId;
				pick.pick_short = toData.teamShort;
				pick.points = pointVal;
				pick.save();
			}
		}
	}
});
export const setPickSync = Meteor.wrapAsync(setPick.call, setPick);

let PicksConditional = null;
let PickConditional = null;

if (dbVersion < 2) {
	PickConditional = Class.create({
		name: 'Pick',
		secured: true,
		fields: {
			week: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
			},
			game_id: String,
			game: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 0 }, { type: 'lte', param: 16 }] }]
			},
			pick_id: {
				type: String,
				optional: true
			},
			pick_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true
			},
			points: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 16 }] }],
				optional: true
			},
			winner_id: {
				type: String,
				optional: true
			},
			winner_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true
			}
		},
		helpers: {
			hasStarted () {
				return gameHasStarted.call({ gameId: this.game_id }, displayError);
			},
			getTeam () {
				const team = getTeamByID.call({ teamId: this.pick_id }, displayError);
				return team;
			}
		}
	});
} else {
	PicksConditional = new Mongo.Collection('picks');
	PickConditional = Class.create({
		name: 'Pick',
		collection: PicksConditional,
		secured: true,
		fields: {
			user_id: String,
			league: {
				type: String,
				default: 'public'
			},
			week: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
			},
			game_id: String,
			game: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 0 }, { type: 'lte', param: 16 }] }]
			},
			pick_id: {
				type: String,
				optional: true
			},
			pick_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true
			},
			points: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 16 }] }],
				optional: true
			},
			winner_id: {
				type: String,
				optional: true
			},
			winner_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true
			}
		},
		helpers: {
			hasStarted () {
				return gameHasStarted.call({ gameId: this.game_id }, displayError);
			},
			getTeam () {
				const team = getTeamByID.call({ teamId: this.pick_id }, displayError);
				return team;
			}
		},
		indexes: {
			onePick: {
				fields: {
					user_id: 1,
					league: 1,
					week: 1,
					game: 1
				},
				options: {
					unique: true
				}
			},
			onePick2: {
				fields: {
					user_id: 1,
					league: 1,
					game_id: 1
				},
				options: {
					unique: true
				}
			}
		}
	});
}

export const Pick = PickConditional;
