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

export const addPick = new ValidatedMethod({
	name: 'Picks.addPick',
	validate: new SimpleSchema({
		pick: { type: Object, label: 'Pick' }
	}).validator(),
	run ({ pick }) {
		const newPick = new Pick(pick);
		if (!this.user_id) throw new Meteor.Error('You are not signed in!');
		newPick.save();
	}
});

export const getPicksForWeek = new ValidatedMethod({
	name: 'Picks.getPicksForWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 },
		league: { type: String, label: 'League' }
	}).validator(),
	run ({ league, week }) {
		const user_id = this.userId;
		const picks = Pick.find({ league, user_id, week }, { sort: { game: 1 } }).fetch();
		if (!user_id) throw new Meteor.Error('You are not signed in!');
		if (!picks) throw new Meteor.Error(`No picks found for week ${week}`);
	}
});

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
			hasStarted() {
				return gameHasStarted.call({ gameId: this.game_id }, displayError);
			},
			getTeam() {
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
			hasStarted() {
				return gameHasStarted.call({ gameId: this.game_id }, displayError);
			},
			getTeam() {
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

//const Picks = PicksConditional;
const Pick = PickConditional;
