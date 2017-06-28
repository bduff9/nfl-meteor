'use strict';

import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';

import { dbVersion } from '../../api/constants';
import { Game } from './games';
import { Team } from './teams';

/**
 * All pick logic
 * @since 2017-06-26
 */

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
				const game = Game.findOne(this.game_id),
						now = new Date();
				return (game.kickoff <= now);
			},
			getTeam() {
				let team;
				team = Team.findOne(this.pick_id);
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
				const game = Game.findOne(this.game_id),
						now = new Date();
				return (game.kickoff <= now);
			},
			getTeam() {
				let team;
				team = Team.findOne(this.pick_id);
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

export const Picks = PicksConditional;
export const Pick = PickConditional;
