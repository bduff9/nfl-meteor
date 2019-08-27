import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { TWeek } from '../commonTypes';

export type THistory = {
	week: TWeek;
	game_id: string;
	opponent_id: string;
	opponent_short: string;
	was_home: boolean;
	did_win: boolean;
	did_tie: boolean;
	final_score: string;
	getOpponent: () => TTeam;
};

export type TTeam = {
	_id: string;
	city: string;
	name: string;
	short_name: string;
	alt_short_name: string;
	conference: 'AFC' | 'NFC';
	division: 'East' | 'North' | 'South' | 'West';
	rank: number;
	logo: string;
	logo_small: string;
	primary_color: string;
	secondary_color: string;
	rush_defense?: number | null;
	pass_defense?: number | null;
	rush_offense?: number | null;
	pass_offense?: number | null;
	bye_week?: number | null;
	history: THistory[];
	isInHistory: (gameId: string) => boolean;
};

/**
 * Game history, sub-schema in team
 */
const History = Class.create({
	name: 'History',
	secured: true,
	fields: {
		week: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [
						{ type: 'required' },
						{ type: 'gte', param: 1 },
						{ type: 'lte', param: 17 },
					],
				},
			],
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		game_id: String,
		// eslint-disable-next-line @typescript-eslint/camelcase
		opponent_id: String,
		// eslint-disable-next-line @typescript-eslint/camelcase
		opponent_short: String,
		// eslint-disable-next-line @typescript-eslint/camelcase
		was_home: Boolean,
		// eslint-disable-next-line @typescript-eslint/camelcase
		did_win: Boolean,
		// eslint-disable-next-line @typescript-eslint/camelcase
		did_tie: Boolean,
		// eslint-disable-next-line @typescript-eslint/camelcase
		final_score: String,
	},
	helpers: {
		getOpponent (): TTeam {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			const team = Team.findOne(this.opponent_id);

			return team;
		},
	},
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
		// eslint-disable-next-line @typescript-eslint/camelcase
		short_name: {
			type: String,
			validators: [{ type: 'length', param: 3 }],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		alt_short_name: {
			type: String,
			validators: [
				{
					type: 'and',
					param: [
						{ type: 'minLength', param: 2 },
						{ type: 'maxLength', param: 3 },
					],
				},
			],
		},
		conference: {
			type: String,
			validators: [{ type: 'choice', param: ['AFC', 'NFC'] }],
		},
		division: {
			type: String,
			validators: [
				{ type: 'choice', param: ['East', 'North', 'South', 'West'] },
			],
		},
		rank: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [{ type: 'gte', param: 0 }, { type: 'lte', param: 4 }],
				},
			],
			optional: true,
		},
		logo: String,
		// eslint-disable-next-line @typescript-eslint/camelcase
		logo_small: String,
		// eslint-disable-next-line @typescript-eslint/camelcase
		primary_color: {
			type: String,
			validators: [{ type: 'regexp', param: /^#(?:[0-9a-f]{3}){1,2}$/i }],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		secondary_color: {
			type: String,
			validators: [{ type: 'regexp', param: /^#(?:[0-9a-f]{3}){1,2}$/i }],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		rush_defense: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }],
				},
			],
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		pass_defense: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }],
				},
			],
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		rush_offense: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }],
				},
			],
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		pass_offense: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }],
				},
			],
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		bye_week: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 17 }],
				},
			],
			optional: true,
		},
		history: {
			type: [History],
			default: (): THistory[] => [],
		},
	},
	helpers: {
		isInHistory (gameId: string): boolean {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			const allHist: THistory[] = this.history;
			const thisHist = allHist.filter((h): boolean => h.game_id === gameId);

			return thisHist.length > 0;
		},
	},
	indexes: {
		shortName: {
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				short_name: 1,
			},
			options: {
				unique: true,
			},
		},
	},
	meteorMethods: {},
});

/**
 * The team schema, which stores all info about NFL teams and their season history
 */

export const getAllNFLTeams = new ValidatedMethod<{}>({
	name: 'Teams.getAllNFLTeams',
	validate: new SimpleSchema({}).validator(),
	run (): TTeam[] {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const teams = Team.find({ short_name: { $ne: 'TIE' } }).fetch();

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		if (!teams) throw new Meteor.Error('No NFL teams found');

		return teams;
	},
});
export const getAllNFLTeamsSync = Meteor.wrapAsync(
	getAllNFLTeams.call,
	getAllNFLTeams,
);

export type TGetTeamByIDProps = { teamId: string };
export const getTeamByID = new ValidatedMethod<TGetTeamByIDProps>({
	name: 'Teams.getTeamByID',
	validate: new SimpleSchema({
		teamId: { type: String, label: 'Team ID' },
	}).validator(),
	run ({ teamId }: TGetTeamByIDProps): TTeam {
		return Team.findOne(teamId);
	},
});
export const getTeamByIDSync = Meteor.wrapAsync(getTeamByID.call, getTeamByID);

export type TGetTeamByShortProps = { short_name: string };
export const getTeamByShort = new ValidatedMethod<TGetTeamByShortProps>({
	name: 'Teams.getTeamByShort',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		short_name: { type: String, label: 'Team Short Name' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ short_name }: TGetTeamByShortProps): TTeam {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const team = Team.findOne({ short_name });

		if (!team)
			throw new Meteor.Error(
				'Teams.getTeamByShort.noTeamFound',
				'No team found',
			);

		return team;
	},
});
export const getTeamByShortSync = Meteor.wrapAsync(
	getTeamByShort.call,
	getTeamByShort,
);

export const teamsExist = new ValidatedMethod<{}>({
	name: 'Teams.teamsExist',
	validate: new SimpleSchema({}).validator(),
	run (): boolean {
		return Team.find().count() > 0;
	},
});
export const teamsExistSync = Meteor.wrapAsync(teamsExist.call, teamsExist);
