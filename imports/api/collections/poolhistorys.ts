import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { TWeek } from '../commonTypes';
import { dbVersion } from '../constants';

import { getUserByID, TUser } from './users';

export type TPoolHistory = {
	_id: string;
	user_id: string;
	year: number;
	league: string;
	type: 'O' | 'S' | 'W';
	week?: TWeek | null;
	place: number;
	getUser: () => TUser;
};

let PoolHistorysConditional = null;
let PoolHistoryConditional = null;

if (dbVersion > 1) {
	PoolHistorysConditional = new Mongo.Collection('poolhistory');
	PoolHistoryConditional = Class.create({
		name: 'PoolHistory',
		collection: PoolHistorysConditional,
		secured: true,
		fields: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: String,
			year: {
				type: Number,
				validators: [{ type: 'gte', param: 2016 }], // BD: First year we started storing history
			},
			league: String,
			type: {
				type: String,
				validators: [{ type: 'choice', param: ['O', 'S', 'W'] }],
			},
			week: {
				type: Number,
				optional: true,
			},
			place: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
			},
		},
		helpers: {
			getUser (): TUser {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				return getUserByID.call({ user_id: this.user_id });
			},
		},
	});
}

export const PoolHistory = PoolHistoryConditional;

/**
 * All pool history logic
 * @since 2017-06-26
 */

export type TAddPoolHistoryProps = { poolHistory: TPoolHistory };
export const addPoolHistory = new ValidatedMethod<TAddPoolHistoryProps>({
	name: 'PoolHistorys.addPoolHistory',
	validate: new SimpleSchema({
		poolHistory: { type: Object, label: 'Pool History', blackbox: true },
	}).validator(),
	run ({ poolHistory }: TAddPoolHistoryProps): void {
		const newHistory = new PoolHistory(poolHistory);

		newHistory.save();
	},
});
export const addPoolHistorySync = Meteor.wrapAsync(
	addPoolHistory.call,
	addPoolHistory,
);

export type TGetPoolHistoryForYearProps = { league: string; year: number };
export const getPoolHistoryForYear = new ValidatedMethod<
	TGetPoolHistoryForYearProps
>({
	name: 'PoolHistorys.getPoolHistoryForYear',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		year: { type: Number, label: 'History Year' },
	}).validator(),
	run ({ league, year }: TGetPoolHistoryForYearProps): TPoolHistory[] {
		const history = PoolHistory.find(
			{ league, year },
			{ sort: { type: 1, week: 1, place: 1 } },
		).fetch();

		if (!this.userId)
			throw new Meteor.Error(
				'Not Authorized',
				'You are not currently signed in.  Please sign in and then try again.',
			);

		return history;
	},
});
export const getPoolHistoryForYearSync = Meteor.wrapAsync(
	getPoolHistoryForYear.call,
	getPoolHistoryForYear,
);

export type TMigratePoolHistoryForUsersProps = {
	newUserId: string;
	oldUserId: string;
};
export const migratePoolHistorysForUser = new ValidatedMethod<
	TMigratePoolHistoryForUsersProps
>({
	name: 'PoolHistorys.migratePoolHistorysForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' },
	}).validator(),
	run ({ newUserId, oldUserId }: TMigratePoolHistoryForUsersProps): void {
		PoolHistory.update(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ user_id: oldUserId },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ $set: { user_id: newUserId } },
			{ multi: true },
		);
	},
});
export const migratePoolHistorysForUserSync = Meteor.wrapAsync(
	migratePoolHistorysForUser.call,
	migratePoolHistorysForUser,
);
