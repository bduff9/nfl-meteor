'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../../api/constants';
import { logError } from '../../api/global';
import { gameHasStartedSync } from './games';
import { writeLog } from './nfllogs';
import { getTeamByIDSync } from './teams';
import { getUserNameSync } from './users';

/**
 * All survivor logic
 * @since 2017-06-26
 */

export const getAllSurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.getAllSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const picks = SurvivorPick.find({ league, week: { $lte: week }}, { sort: { user_id: 1, week: 1 }}).fetch();
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		return picks;
	}
});
export const getAllSurvivorPicksSync = Meteor.wrapAsync(getAllSurvivorPicks.call, getAllSurvivorPicks);

export const getMySurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.getMySurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		user_id: { type: String, label: 'User ID', optional: true }
	}).validator(),
	run ({ league, user_id = this.userId }) {
		const picks = SurvivorPick.find({ league, user_id }, { sort: { week: 1 } }).fetch();
		if (!user_id) throw new Meteor.Error('You are not signed in');
		return picks;
	}
});
export const getMySurvivorPicksSync = Meteor.wrapAsync(getMySurvivorPicks.call, getMySurvivorPicks);

export const getSortedSurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.getSortedSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' }
	}).validator(),
	run ({ league }) {
		const picks = SurvivorPick.find({ league }, { sort: { user_id: 1, week: 1 } }).fetch();
		let pickObjs = [],
				currPlace = 1;
		picks.forEach(pick => {
			const userArr = pickObjs.filter(p => p.user_id === pick.user_id);
			if (userArr.length) {
				userArr[0].weeks++;
			} else {
				const user = { user_id: pick.user_id, weeks: 1, place: -1, tied: false };
				pickObjs.push(user);
			}
		});
		pickObjs.sort((pickA, pickB) => {
			if (pickA.weeks > pickB.weeks) return -1;
			if (pickA.weeks < pickB.weeks) return 1;
			return 0;
		});
		pickObjs.forEach((pick, i, allPicks) => {
			const nextPick = allPicks[i + 1];
			pick.place = currPlace;
			if (pick.weeks === nextPick.weeks) {
				pick.tied = true;
				nextPick.tied = true;
			} else {
				currPlace++;
			}
		});
		return pickObjs;
	}
});
export const getSortedSurvivorPicksSync = Meteor.wrapAsync(getSortedSurvivorPicks.call, getSortedSurvivorPicks);

export const getWeekSurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.getWeekSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const picks = SurvivorPick.find({ league, week }, { sort: { user_id: 1 }}).fetch();
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		return picks;
	}
});
export const getWeekSurvivorPicksSync = Meteor.wrapAsync(getWeekSurvivorPicks.call, getWeekSurvivorPicks);

export const hasSubmittedSurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.hasSubmittedSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const pick = SurvivorPick.findOne({ league, user_id: this.userId, week });
		if (!this.userId) throw new Meteor.Error('SurvivorPicks.hasSubmittedSurvivorPicks.notSignedIn', 'You are not signed in');
		return !pick || !!pick.pick_id;
	}
});
export const hasSubmittedSurvivorPicksSync = Meteor.wrapAsync(hasSubmittedSurvivorPicks.call, hasSubmittedSurvivorPicks);

export const markUserDead = new ValidatedMethod({
	name: 'SurvivorPicks.markUserDead',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		user_id: { type: String, label: 'User ID' },
		weekDead: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, user_id, weekDead }) {
		SurvivorPick.remove({ league, user_id, week: { $gt: weekDead }}, { multi: true });
	}
});
export const markUserDeadSync = Meteor.wrapAsync(markUserDead.sync, markUserDead);

export const migrateSurvivorPicksForUser = new ValidatedMethod({
	name: 'SurvivorPicks.migrateSurvivorPicksForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' }
	}).validator(),
	run ({ newUserId, oldUserId }) {
		SurvivorPick.update({ user_id: oldUserId }, { $set: { user_id: newUserId }}, { multi: true });
	}
});
export const migrateSurvivorPicksForUserSync = Meteor.wrapAsync(migrateSurvivorPicksForUser.call, migrateSurvivorPicksForUser);

export const setSurvivorPick = new ValidatedMethod({
	name: 'SurvivorPicks.setPick',
	validate: new SimpleSchema({
		gameId: { type: String, label: 'Game ID' },
		league: { type: String, label: 'League' },
		teamId: { type: String, label: 'Team ID' },
		teamShort: { type: String, label: 'Team Name' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ gameId, league, teamId, teamShort, week }) {
		const user_id = this.userId;
		if (!user_id) throw new Meteor.Error('SurvivorPicks.setPick.notLoggedIn', 'Must be logged in to update survivor pool');
		const survivorPicks = SurvivorPick.find({ league, user_id }).fetch(),
				pick = survivorPicks.filter(pick => pick.week === week)[0],
				usedIndex = survivorPicks.findIndex(pick => pick.pick_id === teamId);
		if (pick.game_id && pick.hasStarted()) throw new Meteor.Error('SurvivorPicks.setPick.gameAlreadyStarted', 'Cannot change survivor pick for a game that has already begun');
		if (gameHasStartedSync({ gameId })) throw new Meteor.Error('SurvivorPicks.setPick.gameAlreadyStarted', 'Cannot set survivor pick of a game that has already begun');
		if (usedIndex > -1) throw new Meteor.Error('SurvivorPicks.setPick.alreadyUsedTeam', 'Cannot use a single team more than once in a survivor pool');
		if (Meteor.isServer) {
			pick.game_id = gameId;
			pick.pick_id = teamId;
			pick.pick_short = teamShort;
			pick.save();
			writeLog.call({ action: 'SURVIVOR_PICK', message: `${getUserNameSync({ user_id })} just picked ${teamShort} for week ${week}`, userId: user_id }, logError);
		}
	}
});
export const setSurvivorPickSync = Meteor.wrapAsync(setSurvivorPick.call, setSurvivorPick);

let SurvivorPicksConditional = null;
let SurvivorPickConditional = null;

if (dbVersion < 2) {
	SurvivorPickConditional = Class.create({
		name: 'SurvivorPick',
		secured: true,
		fields: {
			week: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
			},
			game_id: {
				type: String,
				optional: true
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
			getTeam () {
				const team = getTeamByIDSync({ teamId: this.pick_id });
				return team;
			},
			hasStarted () {
				return gameHasStartedSync({ gameId: this.game_id });
			}
		}
	});
} else {
	SurvivorPicksConditional = new Mongo.Collection('survivor');
	SurvivorPickConditional = Class.create({
		name: 'SurvivorPick',
		collection: SurvivorPicksConditional,
		secured: true,
		fields: {
			user_id: String,
			league: String,
			week: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
			},
			game_id: {
				type: String,
				optional: true
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
			getTeam () {
				const team = getTeamByIDSync({ teamId: this.pick_id });
				return team;
			},
			hasStarted () {
				return gameHasStartedSync({ gameId: this.game_id });
			}
		},
		indexes: {
			onePick: {
				fields: {
					user_id: 1,
					league: 1,
					week: 1
				},
				options: {
					unique: true
				}
			}
		}
	});
}

export const SurvivorPick = SurvivorPickConditional;
