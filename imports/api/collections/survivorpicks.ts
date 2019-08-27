import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../constants';
import { handleError } from '../global';
import { TWeek, TSortResult } from '../commonTypes';

import { gameHasStartedSync } from './games';
import { writeLog } from './nfllogs';
import { getTeamByIDSync, TTeam } from './teams';
import { getUserNameSync } from './users';

let SurvivorPicksConditional = null;
let SurvivorPickConditional = null;

if (dbVersion < 2) {
	SurvivorPickConditional = Class.create({
		name: 'SurvivorPick',
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
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			game_id: {
				type: String,
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			pick_id: {
				type: String,
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			pick_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			winner_id: {
				type: String,
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			winner_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true,
			},
		},
		helpers: {
			getTeam (): TTeam {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const team = getTeamByIDSync({ teamId: this.pick_id });

				return team;
			},
			hasStarted (): boolean {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				return gameHasStartedSync({ gameId: this.game_id });
			},
		},
	});
} else {
	SurvivorPicksConditional = new Mongo.Collection('survivor');
	SurvivorPickConditional = Class.create({
		name: 'SurvivorPick',
		collection: SurvivorPicksConditional,
		secured: true,
		fields: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: String,
			league: String,
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
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			game_id: {
				type: String,
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			pick_id: {
				type: String,
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			pick_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			winner_id: {
				type: String,
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			winner_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true,
			},
		},
		helpers: {
			getTeam (): TTeam {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const team = getTeamByIDSync({ teamId: this.pick_id });

				return team;
			},
			hasStarted (): boolean {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				return gameHasStartedSync({ gameId: this.game_id });
			},
		},
		indexes: {
			onePick: {
				fields: {
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: 1,
					league: 1,
					week: 1,
				},
				options: {
					unique: true,
				},
			},
		},
	});
}

export const SurvivorPicks = SurvivorPicksConditional;
export const SurvivorPick = SurvivorPickConditional;

export type TSurvivorPick = {
	_id: string;
	user_id: string;
	league: string;
	week: TWeek;
	game_id?: string | null;
	pick_id?: string | null;
	pick_short?: string | null;
	winner_id?: string | null;
	winner_short?: string | null;
	getTeam: () => TTeam;
	hasStarted: () => boolean;
};

/**
 * All survivor logic
 * @since 2017-06-26
 */

export type TGetAllSurvivorPicksProps = { league: string; week: TWeek };
export const getAllSurvivorPicks = new ValidatedMethod<
	TGetAllSurvivorPicksProps
>({
	name: 'SurvivorPicks.getAllSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ league, week }: TGetAllSurvivorPicksProps): TSurvivorPick[] {
		const picks = SurvivorPick.find(
			{ league, week: { $lte: week } },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ sort: { user_id: 1, week: 1 } },
		).fetch();

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		return picks;
	},
});
export const getAllSurvivorPicksSync = Meteor.wrapAsync(
	getAllSurvivorPicks.call,
	getAllSurvivorPicks,
);

export type TGetMySurvivorPicksProps = { league: string; user_id?: string };
export const getMySurvivorPicks = new ValidatedMethod<TGetMySurvivorPicksProps>(
	{
		name: 'SurvivorPicks.getMySurvivorPicks',
		validate: new SimpleSchema({
			league: { type: String, label: 'League' },
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: { type: String, label: 'User ID', optional: true },
		}).validator(),
		run ({
			league,
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id = this.userId,
		}: TGetMySurvivorPicksProps): TSurvivorPick[] {
			const picks = SurvivorPick.find(
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ league, user_id },
				{ sort: { week: 1 } },
			).fetch();

			return picks;
		},
	},
);
export const getMySurvivorPicksSync = Meteor.wrapAsync(
	getMySurvivorPicks.call,
	getMySurvivorPicks,
);

export type TSortedSurvivor = {
	place: number;
	tied: boolean;
	user_id: string;
	weeks: number;
};
export type TGetSortedSurvivorPicksProps = { league: string };
export const getSortedSurvivorPicks = new ValidatedMethod<
	TGetSortedSurvivorPicksProps
>({
	name: 'SurvivorPicks.getSortedSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
	}).validator(),
	run ({ league }: TGetSortedSurvivorPicksProps): TSortedSurvivor[] {
		const picks: TSurvivorPick[] = SurvivorPick.find(
			{ league },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ sort: { user_id: 1, week: 1 } },
		).fetch();
		const pickObjs: TSortedSurvivor[] = [];
		let currPlace = 1;

		picks.forEach(
			(pick): void => {
				const userArr = pickObjs.filter(p => p.user_id === pick.user_id);

				if (userArr.length) {
					userArr[0].weeks++;
				} else {
					const user = {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id: pick.user_id,
						weeks: 1,
						place: -1,
						tied: false,
					};

					pickObjs.push(user);
				}
			},
		);

		pickObjs.sort(
			(pickA, pickB): TSortResult => {
				if (pickA.weeks > pickB.weeks) return -1;

				if (pickA.weeks < pickB.weeks) return 1;

				return 0;
			},
		);

		pickObjs.forEach(
			(pick, i, allPicks): void => {
				const nextPick = allPicks[i + 1];

				pick.place = currPlace;

				if (nextPick && pick.weeks === nextPick.weeks) {
					pick.tied = true;
					nextPick.tied = true;
				} else {
					currPlace++;
				}
			},
		);

		return pickObjs;
	},
});
export const getSortedSurvivorPicksSync = Meteor.wrapAsync(
	getSortedSurvivorPicks.call,
	getSortedSurvivorPicks,
);

export type TGetWeekSurvivorPicksProps = { league: string; week: TWeek };
export const getWeekSurvivorPicks = new ValidatedMethod<
	TGetWeekSurvivorPicksProps
>({
	name: 'SurvivorPicks.getWeekSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ league, week }: TGetWeekSurvivorPicksProps): TSurvivorPick[] {
		const picks = SurvivorPick.find(
			{ league, week },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ sort: { user_id: 1 } },
		).fetch();

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		return picks;
	},
});
export const getWeekSurvivorPicksSync = Meteor.wrapAsync(
	getWeekSurvivorPicks.call,
	getWeekSurvivorPicks,
);

export type THasSubmittedSurvivorPicksProps = { league: string; week: TWeek };
export const hasSubmittedSurvivorPicks = new ValidatedMethod<
	THasSubmittedSurvivorPicksProps
>({
	name: 'SurvivorPicks.hasSubmittedSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ league, week }: THasSubmittedSurvivorPicksProps): boolean {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const pick = SurvivorPick.findOne({ league, user_id: this.userId, week });

		if (!this.userId)
			throw new Meteor.Error(
				'SurvivorPicks.hasSubmittedSurvivorPicks.notSignedIn',
				'You are not signed in',
			);

		return !pick || !!pick.pick_id;
	},
});
export const hasSubmittedSurvivorPicksSync = Meteor.wrapAsync(
	hasSubmittedSurvivorPicks.call,
	hasSubmittedSurvivorPicks,
);

export type TMarkUserDeadProps = {
	league: string;
	user_id: string;
	weekDead: TWeek;
};
export const markUserDead = new ValidatedMethod({
	name: 'SurvivorPicks.markUserDead',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
		weekDead: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ league, user_id, weekDead }: TMarkUserDeadProps): void {
		SurvivorPick.remove(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ league, user_id, week: { $gt: weekDead } },
			{ multi: true },
		);
	},
});
export const markUserDeadSync = Meteor.wrapAsync(
	markUserDead.sync,
	markUserDead,
);

export type TMigrateSurvivorPicksForUserProps = {
	newUserId: string;
	oldUserId: string;
};
export const migrateSurvivorPicksForUser = new ValidatedMethod<
	TMigrateSurvivorPicksForUserProps
>({
	name: 'SurvivorPicks.migrateSurvivorPicksForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' },
	}).validator(),
	run ({ newUserId, oldUserId }: TMigrateSurvivorPicksForUserProps): void {
		SurvivorPick.update(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ user_id: oldUserId },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ $set: { user_id: newUserId } },
			{ multi: true },
		);
	},
});
export const migrateSurvivorPicksForUserSync = Meteor.wrapAsync(
	migrateSurvivorPicksForUser.call,
	migrateSurvivorPicksForUser,
);

export type TSetSurvivorPickProps = {
	gameId: string;
	league: string;
	teamId: string;
	teamShort: string;
	week: TWeek;
};
export const setSurvivorPick = new ValidatedMethod<TSetSurvivorPickProps>({
	name: 'SurvivorPicks.setPick',
	validate: new SimpleSchema({
		gameId: { type: String, label: 'Game ID' },
		league: { type: String, label: 'League' },
		teamId: { type: String, label: 'Team ID' },
		teamShort: { type: String, label: 'Team Name' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({
		gameId,
		league,
		teamId,
		teamShort,
		week,
	}: TSetSurvivorPickProps): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const user_id = this.userId;

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id)
			throw new Meteor.Error(
				'SurvivorPicks.setPick.notLoggedIn',
				'Must be logged in to update survivor pool',
			);

		const survivorPicks: TSurvivorPick[] = SurvivorPick.find({
			league,
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id,
		}).fetch();
		const pick = survivorPicks.filter((pick): boolean => pick.week === week)[0];
		const usedIndex = survivorPicks.findIndex(
			(pick): boolean => pick.pick_id === teamId,
		);

		if (pick.game_id && pick.hasStarted())
			throw new Meteor.Error(
				'SurvivorPicks.setPick.gameAlreadyStarted',
				'Cannot change survivor pick for a game that has already begun',
			);

		if (gameHasStartedSync({ gameId }))
			throw new Meteor.Error(
				'SurvivorPicks.setPick.gameAlreadyStarted',
				'Cannot set survivor pick of a game that has already begun',
			);

		if (usedIndex > -1)
			throw new Meteor.Error(
				'SurvivorPicks.setPick.alreadyUsedTeam',
				'Cannot use a single team more than once in a survivor pool',
			);

		if (Meteor.isServer) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			pick.game_id = gameId;
			// eslint-disable-next-line @typescript-eslint/camelcase
			pick.pick_id = teamId;
			// eslint-disable-next-line @typescript-eslint/camelcase
			pick.pick_short = teamShort;
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			pick.save();
			writeLog.call(
				{
					action: 'SURVIVOR_PICK',
					message: `${getUserNameSync({
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id,
					})} just picked ${teamShort} for week ${week}`,
					// eslint-disable-next-line @typescript-eslint/camelcase
					userId: user_id,
				},
				handleError,
			);
		}
	},
});
export const setSurvivorPickSync = Meteor.wrapAsync(
	setSurvivorPick.call,
	setSurvivorPick,
);
