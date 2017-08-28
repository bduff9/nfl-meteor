'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

/**
 * The team schema, which stores all info about NFL teams and their season history
 */

export const getAllNFLTeams = new ValidatedMethod({
	name: 'Teams.getAllNFLTeams',
	validate: new SimpleSchema({}).validator(),
	run () {
		const teams = Team.find({ short_name: { $ne: 'TIE' }}).fetch();
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		if (!teams) throw new Meteor.Error('No NFL teams found');
		return teams;
	}
});
export const getAllNFLTeamsSync = Meteor.wrapAsync(getAllNFLTeams.call, getAllNFLTeams);

export const getTeamByID = new ValidatedMethod({
	name: 'Teams.getTeamByID',
	validate: new SimpleSchema({
		teamId: { type: String, label: 'Team ID' }
	}).validator(),
	run ({ teamId }) {
		return Team.findOne(teamId);
	}
});
export const getTeamByIDSync = Meteor.wrapAsync(getTeamByID.call, getTeamByID);

export const getTeamByShort = new ValidatedMethod({
	name: 'Teams.getTeamByShort',
	validate: new SimpleSchema({
		short_name: { type: String, label: 'Team Short Name' }
	}).validator(),
	run ({ short_name }) {
		const team = Team.findOne({ short_name });
		if (!team) throw new Meteor.Error('Teams.getTeamByShort.noTeamFound', 'No team found');
		return team;
	}
});
export const getTeamByShortSync = Meteor.wrapAsync(getTeamByShort.call, getTeamByShort);

export const teamsExist = new ValidatedMethod({
	name: 'Teams.teamsExist',
	validate: new SimpleSchema({}).validator(),
	run () {
		return Team.find().count() > 0;
	}
});
export const teamsExistSync = Meteor.wrapAsync(teamsExist.call, teamsExist);

/**
 * Game history, sub-schema in team
 */
const History = Class.create({
	name: 'History',
	secured: true,
	fields: {
		week: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }],
			optional: true
		},
		game_id: String,
		opponent_id: String,
		opponent_short: String,
		was_home: Boolean,
		did_win: Boolean,
		did_tie: Boolean,
		final_score: String
	},
	helpers: {
		getOpponent () {
			const team = Team.findOne(this.opponent_id);
			return team;
		}
	}
});

/**
 * Team schema
 */
const Teams = new Mongo.Collection('teams');
export const Team = Class.create({
	name: 'Team',
	collection: Teams,
	secured: true,
	fields: {
		city: String,
		name: String,
		short_name: {
			type: String,
			validators: [{ type: 'length', param: 3 }]
		},
		alt_short_name: {
			type: String,
			validators: [{ type: 'and', param: [{ type: 'minLength', param: 2 }, { type: 'maxLength', param: 3 }] }]
		},
		conference: {
			type: String,
			validators: [{ type: 'choice', param: ['AFC', 'NFC'] }]
		},
		division: {
			type: String,
			validators: [{ type: 'choice', param: ['East', 'North', 'South', 'West'] }]
		},
		rank: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'gte', param: 0 }, { type: 'lte', param: 4 }] }],
			optional: true
		},
		logo: String,
		logo_small: String,
		primary_color: {
			type: String,
			validators: [{ type: 'regexp', param: /^#(?:[0-9a-f]{3}){1,2}$/i }]
		},
		secondary_color: {
			type: String,
			validators: [{ type: 'regexp', param: /^#(?:[0-9a-f]{3}){1,2}$/i }]
		},
		rush_defense: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }] }],
			optional: true
		},
		pass_defense: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }] }],
			optional: true
		},
		rush_offense: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }] }],
			optional: true
		},
		pass_offense: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }] }],
			optional: true
		},
		bye_week: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }],
			optional: true
		},
		history: {
			type: [History],
			default: () => []
		}
	},
	helpers: {
		isInHistory (gameId) {
			const allHist = this.history,
					thisHist = allHist.filter(h => h.game_id === gameId);
			return thisHist.length > 0;
		}
	},
	indexes: {
		shortName: {
			fields: {
				short_name: 1
			},
			options: {
				unique: true
			}
		}
	},
	meteorMethods: {}
});
