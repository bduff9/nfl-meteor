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
import { getPicksForWeek } from './picks';
import { getUserByID, getUserName, sendAllPicksInEmail, TUser } from './users';

/**
 * All tiebreaker logic
 * @since 2017-06-26
 */

export const getAllTiebreakersForUser = new ValidatedMethod({
	name: 'Tiebreakers.getAllTiebreakersForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	run({ league, user_id }) {
		const tbs = Tiebreaker.find(
			{ league, user_id },
			{ sort: { week: 1 } },
		).fetch();

		if (!tbs)
			throw new Meteor.Error(`No tiebreakers found for user ${user_id}`);

		return tbs;
	},
});
export const getAllTiebreakersForUserSync = Meteor.wrapAsync(
	getAllTiebreakersForUser.call,
	getAllTiebreakersForUser,
);

export const getAllTiebreakersForWeek = new ValidatedMethod({
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
	run({ league, overrideSort, week }) {
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

export const getTiebreaker = new ValidatedMethod({
	name: 'Tiebreaker.getTiebreaker',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		user_id: { type: String, label: 'User ID', optional: true },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run({ league, user_id = this.userId, week }) {
		const tb = Tiebreaker.findOne({ league, user_id, week });

		if (!user_id) throw new Meteor.Error('You are not signed in!');

		return tb;
	},
});
export const getTiebreakerSync = Meteor.wrapAsync(
	getTiebreaker.call,
	getTiebreaker,
);

export const getUnsubmittedPicksForWeek = new ValidatedMethod({
	name: 'Tiebreakers.getUnsubmittedPicksForWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' },
	}).validator(),
	run({ week }) {
		const unsubmitted = Tiebreaker.find({ submitted: false, week }).fetch();

		return unsubmitted;
	},
});
export const getUnsubmittedPicksForWeekSync = Meteor.wrapAsync(
	getUnsubmittedPicksForWeek.call,
	getUnsubmittedPicksForWeek,
);

export const hasAllSubmitted = new ValidatedMethod({
	name: 'Tiebreakers.hasAllSubmitted',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run({ league, week }) {
		const users = Tiebreaker.find({ league, week }).fetch();
		const haveNotSubmitted = users.filter(user => !user.submitted);

		return haveNotSubmitted.length === 0;
	},
});
export const hasAllSubmittedSync = Meteor.wrapAsync(
	hasAllSubmitted.call,
	hasAllSubmitted,
);

export const migrateTiebreakersForUser = new ValidatedMethod({
	name: 'Tiebreakers.migrateTiebreakersForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' },
	}).validator(),
	run({ newUserId, oldUserId }) {
		Tiebreaker.update(
			{ user_id: oldUserId },
			{ $set: { user_id: newUserId } },
			{ multi: true },
		);
	},
});
export const migrateTiebreakersForUserSync = Meteor.wrapAsync(
	migrateTiebreakersForUser.call,
	migrateTiebreakersForUser,
);

export const resetTiebreaker = new ValidatedMethod({
	name: 'Tiebreakers.resetTiebreaker',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run({ league, week }) {
		if (!this.userId)
			throw new Meteor.Error(
				'Tiebreakers.resetTiebreaker.notLoggedIn',
				'Must be logged in to reset tiebreaker',
			);

		if (Meteor.isServer) {
			const tb = Tiebreaker.findOne({ league, user_id: this.userId, week });

			tb.last_score = undefined;
			tb.save();
		}
	},
});
export const resetTiebreakerSync = Meteor.wrapAsync(
	resetTiebreaker.call,
	resetTiebreaker,
);

export const setTiebreaker = new ValidatedMethod({
	name: 'Tiebreakers.setTiebreaker',
	validate: new SimpleSchema({
		lastScore: { type: Number, label: 'Last Score', min: 2 },
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run({ lastScore, league, week }) {
		const user_id = this.userId;
		const tb = Tiebreaker.findOne({ league, user_id, week });

		if (!user_id)
			throw new Meteor.Error(
				'Tiebreakers.setTiebreaker.notLoggedIn',
				'Must be logged in to update tiebreaker',
			);

		if (Meteor.isServer) {
			tb.last_score = lastScore;
			tb.save();
		}
	},
});
export const setTiebreakerSync = Meteor.wrapAsync(
	setTiebreaker.call,
	setTiebreaker,
);

export const submitPicks = new ValidatedMethod({
	name: 'Tiebreakers.submitPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run({ league, week }) {
		const user_id = this.userId;

		if (!user_id)
			throw new Meteor.Error(
				'Tiebreakers.submitPicks.notLoggedIn',
				'Must be logged in to submit picks',
			);

		const tiebreaker = Tiebreaker.findOne({ league, user_id, week });
		const picks = getPicksForWeek.call({ league, week });
		const noPicks = picks.filter(
			pick =>
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
			tiebreaker.save();
			sendAllPicksInEmail.call({ selectedWeek: week }, handleError);
		}

		writeLog.call(
			{
				action: 'SUBMIT_PICKS',
				message: `${getUserName.call({
					user_id,
				})} has just submitted their week ${week} picks`,
				userId: user_id,
			},
			handleError,
		);
	},
});
export const submitPicksSync = Meteor.wrapAsync(submitPicks.call, submitPicks);

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
			last_score: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			submitted: {
				type: Boolean,
				default: false,
			},
			last_score_act: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
				optional: true,
			},
			points_earned: {
				type: Number,
				default: 0,
			},
			games_correct: {
				type: Number,
				default: 0,
			},
			place_in_week: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
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
			last_score: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			submitted: {
				type: Boolean,
				default: false,
			},
			last_score_act: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
				optional: true,
			},
			points_earned: {
				type: Number,
				default: 0,
			},
			games_correct: {
				type: Number,
				default: 0,
			},
			place_in_week: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			tied_flag: {
				type: Boolean,
				default: false,
			},
		},
		helpers: {
			getFullName() {
				const name = getUserName.call({ user_id: this.user_id });

				return name;
			},
			getUser() {
				const user = getUserByID.call({ user_id: this.user_id });

				return user;
			},
		},
		indexes: {
			oneWeek: {
				fields: {
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

export type TTiebreaker = {
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

export const Tiebreaker = TiebreakerConditional;
