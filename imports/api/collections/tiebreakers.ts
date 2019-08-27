import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { TWeek } from '../commonTypes';
import { dbVersion } from '../constants';
import { handleError } from '../global';

import { gameHasStarted } from './games';
import { writeLog } from './nfllogs';
import { getPicksForWeek, TPick } from './picks';
import { getUserByID, getUserName, sendAllPicksInEmail, TUser } from './users';

export type TTiebreaker = {
	_id: string;
	user_id: string;
	league: string;
	week: TWeek;
	last_score?: number | null;
	submitted: boolean;
	last_score_act?: number | null;
	points_earned: number;
	games_correct: number;
	place_in_week?: number | null;
	tied_flag: boolean;
	getFullName: () => string;
	getUser: () => TUser;
};

let TiebreakersConditional = null;
let TiebreakerConditional = null;

if (dbVersion < 2) {
	TiebreakerConditional = Class.create({
		name: 'Tiebreaker',
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
			last_score: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			submitted: {
				type: Boolean,
				default: false,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			last_score_act: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			points_earned: {
				type: Number,
				default: 0,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			games_correct: {
				type: Number,
				default: 0,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			place_in_week: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			tied_flag: {
				type: Boolean,
				default: false,
			},
		},
	});
} else {
	TiebreakersConditional = new Mongo.Collection('tiebreakers');
	TiebreakerConditional = Class.create({
		name: 'Tiebreaker',
		collection: TiebreakersConditional,
		secured: true,
		fields: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: String,
			league: {
				type: String,
				default: 'public',
			},
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
			last_score: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			submitted: {
				type: Boolean,
				default: false,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			last_score_act: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			points_earned: {
				type: Number,
				default: 0,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			games_correct: {
				type: Number,
				default: 0,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			place_in_week: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			tied_flag: {
				type: Boolean,
				default: false,
			},
		},
		helpers: {
			getFullName (): string {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const name: string = getUserName.call({ user_id: this.user_id });

				return name;
			},
			getUser (): TUser {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user: TUser = getUserByID.call({ user_id: this.user_id });

				return user;
			},
		},
		indexes: {
			oneWeek: {
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

export const Tiebreaker = TiebreakerConditional;

/**
 * All tiebreaker logic
 * @since 2017-06-26
 */

export type TGetAllTiebreakersForUserProps = {
	league: string;
	user_id: string;
};
export const getAllTiebreakersForUser = new ValidatedMethod<
	TGetAllTiebreakersForUserProps
>({
	name: 'Tiebreakers.getAllTiebreakersForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ league, user_id }: TGetAllTiebreakersForUserProps): TTiebreaker[] {
		const tbs = Tiebreaker.find(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ league, user_id },
			{ sort: { week: 1 } },
		).fetch();

		if (!tbs) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			throw new Meteor.Error(`No tiebreakers found for user ${user_id}`);
		}

		return tbs;
	},
});
export const getAllTiebreakersForUserSync = Meteor.wrapAsync(
	getAllTiebreakersForUser.call,
	getAllTiebreakersForUser,
);

export type TTiebreakerSort = {
	games_correct?: -1 | 1;
	points_earned?: -1 | 1;
};
export type TGetAllTiebreakersForWeekProps = {
	league: string;
	overrideSort: TTiebreakerSort;
	week: TWeek;
};
export const getAllTiebreakersForWeek = new ValidatedMethod<
	TGetAllTiebreakersForWeekProps
>({
	name: 'Tiebreakers.getAllTiebreakersForWeek',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		overrideSort: {
			type: Object,
			label: 'Sort',
			optional: true,
			blackbox: true,
		},
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({
		league,
		overrideSort,
		week,
	}: TGetAllTiebreakersForWeekProps): TTiebreaker[] {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const sort = overrideSort || { points_earned: -1, games_correct: -1 };
		const tbs = Tiebreaker.find({ league, week }, { sort }).fetch();

		if (!tbs) throw new Meteor.Error(`No tiebreakers found for week ${week}`);

		return tbs;
	},
});
export const getAllTiebreakersForWeekSync = Meteor.wrapAsync(
	getAllTiebreakersForWeek.call,
	getAllTiebreakersForWeek,
);

export type TGetTiebreakerProps = {
	league: string;
	user_id?: string;
	week: TWeek;
};
export const getTiebreaker = new ValidatedMethod<TGetTiebreakerProps>({
	name: 'Tiebreaker.getTiebreaker',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID', optional: true },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({
		league,
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id = this.userId,
		week,
	}: TGetTiebreakerProps): TTiebreaker {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const tb = Tiebreaker.findOne({ league, user_id, week });

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id) throw new Meteor.Error('You are not signed in!');

		return tb;
	},
});
export const getTiebreakerSync = Meteor.wrapAsync(
	getTiebreaker.call,
	getTiebreaker,
);

export type TGetUnsubmittedPicksForWeekProps = { week: TWeek };
export const getUnsubmittedPicksForWeek = new ValidatedMethod<
	TGetUnsubmittedPicksForWeekProps
>({
	name: 'Tiebreakers.getUnsubmittedPicksForWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' },
	}).validator(),
	run ({ week }: TGetUnsubmittedPicksForWeekProps): TTiebreaker[] {
		const unsubmitted = Tiebreaker.find({ submitted: false, week }).fetch();

		return unsubmitted;
	},
});
export const getUnsubmittedPicksForWeekSync = Meteor.wrapAsync(
	getUnsubmittedPicksForWeek.call,
	getUnsubmittedPicksForWeek,
);

export type THasAllSubmittedProps = { league: string; week: TWeek };
export const hasAllSubmitted = new ValidatedMethod<THasAllSubmittedProps>({
	name: 'Tiebreakers.hasAllSubmitted',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ league, week }: THasAllSubmittedProps): boolean {
		const users: TTiebreaker[] = Tiebreaker.find({ league, week }).fetch();
		const haveNotSubmitted = users.filter((user): boolean => !user.submitted);

		return haveNotSubmitted.length === 0;
	},
});
export const hasAllSubmittedSync = Meteor.wrapAsync(
	hasAllSubmitted.call,
	hasAllSubmitted,
);

export type TMigrateTiebreakersForUserProps = {
	newUserId: string;
	oldUserId: string;
};
export const migrateTiebreakersForUser = new ValidatedMethod<
	TMigrateTiebreakersForUserProps
>({
	name: 'Tiebreakers.migrateTiebreakersForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' },
	}).validator(),
	run ({ newUserId, oldUserId }: TMigrateTiebreakersForUserProps): void {
		Tiebreaker.update(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ user_id: oldUserId },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ $set: { user_id: newUserId } },
			{ multi: true },
		);
	},
});
export const migrateTiebreakersForUserSync = Meteor.wrapAsync(
	migrateTiebreakersForUser.call,
	migrateTiebreakersForUser,
);

export type TResetTiebreakerProps = { league: string; week: TWeek };
export const resetTiebreaker = new ValidatedMethod<TResetTiebreakerProps>({
	name: 'Tiebreakers.resetTiebreaker',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ league, week }: TResetTiebreakerProps): void {
		if (!this.userId)
			throw new Meteor.Error(
				'Tiebreakers.resetTiebreaker.notLoggedIn',
				'Must be logged in to reset tiebreaker',
			);

		if (Meteor.isServer) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			const tb = Tiebreaker.findOne({ league, user_id: this.userId, week });

			// eslint-disable-next-line @typescript-eslint/camelcase
			tb.last_score = undefined;
			tb.save();
		}
	},
});
export const resetTiebreakerSync = Meteor.wrapAsync(
	resetTiebreaker.call,
	resetTiebreaker,
);

export type TSetTiebreakerProps = {
	lastScore: number;
	league: string;
	week: TWeek;
};
export const setTiebreaker = new ValidatedMethod<TSetTiebreakerProps>({
	name: 'Tiebreakers.setTiebreaker',
	validate: new SimpleSchema({
		lastScore: { type: Number, label: 'Last Score', min: 2 },
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ lastScore, league, week }: TSetTiebreakerProps): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const user_id = this.userId;
		// eslint-disable-next-line @typescript-eslint/camelcase
		const tb = Tiebreaker.findOne({ league, user_id, week });

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id)
			throw new Meteor.Error(
				'Tiebreakers.setTiebreaker.notLoggedIn',
				'Must be logged in to update tiebreaker',
			);

		if (Meteor.isServer) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			tb.last_score = lastScore;
			tb.save();
		}
	},
});
export const setTiebreakerSync = Meteor.wrapAsync(
	setTiebreaker.call,
	setTiebreaker,
);

export type TSubmitPicksProps = { league: string; week: TWeek };
export const submitPicks = new ValidatedMethod<TSubmitPicksProps>({
	name: 'Tiebreakers.submitPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ league, week }: TSubmitPicksProps): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const user_id = this.userId;

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id)
			throw new Meteor.Error(
				'Tiebreakers.submitPicks.notLoggedIn',
				'Must be logged in to submit picks',
			);

		const tiebreaker: TTiebreaker = Tiebreaker.findOne({
			league,
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id,
			week,
		});
		const picks: TPick[] = getPicksForWeek.call({ league, week });
		const noPicks = picks.filter(
			(pick): boolean =>
				!gameHasStarted.call({ gameId: pick.game_id }) &&
				(!pick.pick_id || !pick.pick_short || !pick.points),
		);

		if (noPicks.length > 0)
			throw new Meteor.Error(
				'Tiebreakers.submitPicks.missingPicks',
				'You must complete all picks for the week before submitting',
			);

		if (!tiebreaker.last_score)
			throw new Meteor.Error(
				'Tiebreakers.submitPicks.noTiebreakerScore',
				'You must submit a tiebreaker score for the last game of the week',
			);

		if (Meteor.isServer) {
			tiebreaker.submitted = true;
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			tiebreaker.save();
			sendAllPicksInEmail.call({ selectedWeek: week }, handleError);
		}

		writeLog.call(
			{
				action: 'SUBMIT_PICKS',
				message: `${getUserName.call({
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id,
				})} has just submitted their week ${week} picks`,
				// eslint-disable-next-line @typescript-eslint/camelcase
				userId: user_id,
			},
			handleError,
		);
	},
});
export const submitPicksSync = Meteor.wrapAsync(submitPicks.call, submitPicks);
