'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../../api/constants';
import { displayError } from '../../api/global';
import { gameHasStarted, gameHasStartedSync, getGameByIDSync } from './games';
import { getTeamByIDSync } from './teams';

/**
 * All pick logic
 * @since 2017-06-26
 */

export const assignPointsToMissed = new ValidatedMethod({
	name: 'Picks.assignPointsToMissed',
	validate: new SimpleSchema({
		gameCount: { type: Number, label: 'Number of Games', min: 13, max: 16 },
		gameId: { type: String, label: 'Game ID' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ gameCount, gameId, week }) {
		if (Meteor.isServer) {
			const missedPicks = Pick.find({ game_id: gameId, points: null }).fetch();
			if (missedPicks.length) console.log(`${missedPicks.length} users missed game ${gameId} in week ${week}`);
			missedPicks.forEach(missedPick => {
				const { user_id } = missedPick,
						usersPicks = Pick.find({ user_id, week }).fetch(),
						pointsUsed = usersPicks.filter(pick => pick.points).map(pick => pick.points);
				let maxPointVal = gameCount;
				while (pointsUsed.indexOf(maxPointVal) > -1) maxPointVal--;
				missedPick.points = maxPointVal;
				missedPick.save();
				console.log(`Auto assigned ${maxPointVal} points to user ${user_id}`);
			});
		}
	}
});
export const assignPointsToMissedSync = Meteor.wrapAsync(assignPointsToMissed.call, assignPointsToMissed);

export const autoPick = new ValidatedMethod({
	name: 'Picks.autoPick',
	validate: new SimpleSchema({
		available: { type: [Number], label: 'Available Points', minCount: 1, maxCount: 16 },
		league: { type: String, label: 'League' },
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
		type: { type: String, label: 'Auto Pick Type', allowedValues: ['home', 'away', 'random'] }
	}).validator(),
	run ({ available, league, selectedWeek, type }) {
		if (!this.userId) throw new Meteor.Error('Picks.autoPick.notLoggedIn', 'Must be logged in to update picks');
		if (Meteor.isServer) {
			const picks = Pick.find({ league, user_id: this.userId, week: selectedWeek }).fetch(),
					pointsLeft = Object.assign([], available);
			let game, randomTeam, teamId, teamShort, pointIndex, point;
			picks.forEach(pick => {
				if (!pick.hasStarted() && !pick.pick_id) {
					game = getGameByIDSync({ gameId: pick.game_id });
					randomTeam = Math.random();
					if (type === 'home' || (type === 'random' && randomTeam < 0.5)) {
						teamId = game.home_id;
						teamShort = game.home_short;
					} else if (type === 'away' || type === 'random') {
						teamId = game.visitor_id;
						teamShort = game.visitor_short;
					}
					pointIndex = Math.floor(Math.random() * pointsLeft.length);
					point = pointsLeft.splice(pointIndex, 1);
					pick.pick_id = teamId;
					pick.pick_short = teamShort;
					pick.points = point[0];
					//pick.save();
				}
			});
			picks.forEach(pick => { pick.save(); });
		}
	}
});
export const autoPickSync = Meteor.wrapAsync(autoPick.call, autoPick);

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

export const getAllPicksForUser = new ValidatedMethod({
	name: 'Picks.getAllPicksForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ league, user_id }) {
		const picks = Pick.find({ league, user_id }, { sort: { week: 1, game: 1 } }).fetch();
		if (!picks) throw new Meteor.Error(`No picks found for user ${user_id}`);
		return picks;
	}
});
export const getAllPicksForUserSync = Meteor.wrapAsync(getAllPicksForUser.call, getAllPicksForUser);

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
		user_id: { type: String, label: 'User ID', optional: true },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, user_id = this.userId, week }) {
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

export const resetPicks = new ValidatedMethod({
	name: 'Picks.resetPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, selectedWeek }) {
		if (!this.userId) throw new Meteor.Error('Picks.resetPicks.notLoggedIn', 'Must be logged in to reset picks');
		if (Meteor.isServer) Pick.update({ league, user_id: this.userId, week: selectedWeek }, { $set: { pick_id: undefined, pick_short: undefined, points: undefined }}, { multi: true });
	}
});
export const resetPicksSync = Meteor.wrapAsync(resetPicks.call, resetPicks);

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
				return gameHasStartedSync({ gameId: this.game_id });
			},
			getTeam () {
				const team = getTeamByIDSync({ teamId: this.pick_id });
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
				return gameHasStartedSync({ gameId: this.game_id });
			},
			getTeam () {
				const team = getTeamByIDSync({ teamId: this.pick_id });
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
