import { differenceInHours } from 'date-fns';
import { chain } from 'lodash';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';

import {
	ACCOUNT_TYPES,
	AUTO_PICK_TYPES,
	dbVersion,
	DEFAULT_AUTO_PICK_COUNT,
	DEFAULT_LEAGUE,
	POOL_COST,
	SURVIVOR_COST,
} from '../constants';
import {
	getCurrentSeasonYear,
	handleError,
	overallPlacer,
	weekPlacer,
} from '../global';
import { TWeek, TPaymentType, TAutoPickStrategy } from '../commonTypes';

import { writeLog } from './nfllogs';
import { getAllPicksForUser, Pick, TPick } from './picks';
import {
	getMySurvivorPicks,
	markUserDead,
	SurvivorPick,
	TSurvivorPick,
} from './survivorpicks';
import { getSystemValues, TSystemVals } from './systemvals';
import {
	getAllTiebreakersForUser,
	getAllTiebreakersForWeek,
	hasAllSubmitted,
	Tiebreaker,
	TTiebreaker,
} from './tiebreakers';

export type TNotification = {
	type: ('email' | 'text')[];
	hours_before: number;
	is_quick: boolean;
};

export type TSelectedWeek = {
	week: TWeek;
	selected_on: Date;
};

export type TUser = Meteor.User & {
	_id: string;
	services?: object;
	email: string;
	phone_number?: string;
	notifications: TNotification[];
	first_name: string;
	last_name: string;
	team_name: string;
	referred_by: string;
	verified: boolean;
	trusted?: boolean;
	done_registering: boolean;
	leagues: string[];
	is_admin: boolean;
	survivor: boolean;
	payment_type: TPaymentType;
	payment_account?: string;
	owe: number;
	paid: number;
	selected_week: TSelectedWeek;
	total_points: number;
	total_games: number;
	overall_place: number;
	overall_tied_flag: boolean;
	auto_pick_count: number;
	auto_pick_strategy: TAutoPickStrategy;
	years_played: number[];
	getSelectedWeek: () => TWeek;
};

/**
 * Notification, sub-schema from User
 */
let NotificationConditional = null;

if (dbVersion > 1) {
	NotificationConditional = Class.create({
		name: 'Notification',
		secured: true,
		fields: {
			type: {
				type: [String],
				validators: [
					{
						type: 'every',
						param: [{ type: 'choice', param: ['email', 'text'] }],
					},
				],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			hours_before: {
				type: Number,
				validators: [
					{
						type: 'and',
						param: [{ type: 'gt', param: 0 }, { type: 'lt', param: 72 }],
					},
				],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_quick: {
				type: Boolean,
				default: false,
			},
		},
	});
}
export const Notification = NotificationConditional;

/**
 * Selected Week, sub-schema in User
 */
export const SelectedWeek = Class.create({
	name: 'SelectedWeek',
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
		selected_on: {
			type: Date,
			optional: true,
		},
	},
});

/**
 * User schema
 */
let UserConditional;

if (dbVersion < 2) {
	UserConditional = Class.create({
		name: 'User',
		collection: Meteor.users,
		secured: true,
		fields: {
			email: {
				type: String,
				validators: [{ type: 'email' }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			first_name: {
				type: String,
				validators: [{ type: 'minLength', param: 1 }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			last_name: {
				type: String,
				validators: [{ type: 'minLength', param: 1 }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			team_name: String,
			// eslint-disable-next-line @typescript-eslint/camelcase
			referred_by: {
				type: String,
				validators: [
					{
						type: 'minLength',
						param: 1,
						message: 'Please select whether you have played before or are new',
					},
				],
			},
			verified: Boolean,
			trusted: {
				type: Boolean,
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			done_registering: Boolean,
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_admin: {
				type: Boolean,
				default: false,
			},
			paid: Boolean,
			// eslint-disable-next-line @typescript-eslint/camelcase
			selected_week: {
				type: SelectedWeek,
				default: (): {} => ({}),
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			total_points: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			total_games: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			overall_place: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			overall_tied_flag: {
				type: Boolean,
				default: false,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			bonus_points: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
			},
			picks: {
				type: [Pick],
				default: (): TPick[] => [],
			},
			tiebreakers: {
				type: [Tiebreaker],
				default: (): TTiebreaker[] => [],
			},
			survivor: {
				type: [SurvivorPick],
				default: (): TSurvivorPick[] => [],
			},
		},
		helpers: {
			getSelectedWeek (): TSelectedWeek | null {
				const NO_WEEK_SELECTED = null;
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const { selected_on, week } = this.selected_week;

				// eslint-disable-next-line @typescript-eslint/camelcase
				if (!selected_on) return NO_WEEK_SELECTED;

				const hrs = differenceInHours(new Date(), new Date(selected_on));

				if (hrs < 24) return week;

				return NO_WEEK_SELECTED;
			},
		},
		indexes: {},
	});
} else {
	UserConditional = Class.create({
		name: 'User',
		collection: Meteor.users,
		secured: true,
		fields: {
			services: {
				type: Object,
				optional: true,
			},
			email: {
				type: String,
				validators: [{ type: 'email' }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			phone_number: {
				type: String,
				optional: true,
			},
			notifications: {
				type: [Notification],
				default: (): TNotification[] => [],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			first_name: {
				type: String,
				validators: [{ type: 'minLength', param: 1 }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			last_name: {
				type: String,
				validators: [{ type: 'minLength', param: 1 }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			team_name: String,
			// eslint-disable-next-line @typescript-eslint/camelcase
			referred_by: {
				type: String,
				validators: [
					{
						type: 'minLength',
						param: 1,
						message: 'Please select whether you have played before or are new',
					},
				],
			},
			verified: Boolean,
			trusted: {
				type: Boolean,
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			done_registering: Boolean,
			leagues: {
				type: [String],
				default: (): string[] => [DEFAULT_LEAGUE],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_admin: {
				type: Boolean,
				default: false,
			},
			survivor: {
				type: Boolean,
				default: false,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			payment_type: {
				type: String,
				validators: [{ type: 'choice', param: ACCOUNT_TYPES }],
				default: 'Cash',
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			payment_account: {
				type: String,
				optional: true,
			},
			owe: {
				type: Number,
				default: 0.0,
			},
			paid: {
				type: Number,
				default: 0.0,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			selected_week: {
				type: SelectedWeek,
				default: (): {} => ({}),
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			total_points: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			total_games: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			overall_place: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			overall_tied_flag: {
				type: Boolean,
				default: false,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			auto_pick_count: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
				default: 0,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			auto_pick_strategy: {
				type: String,
				validators: [{ type: 'choice', param: ['', ...AUTO_PICK_TYPES] }],
				default: '',
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			years_played: {
				type: [Number],
				default: (): number[] => [],
			},
		},
		helpers: {
			getSelectedWeek (): TSelectedWeek | null {
				const NO_WEEK_SELECTED = null;
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const { selected_on, week } = this.selected_week;

				// eslint-disable-next-line @typescript-eslint/camelcase
				if (!selected_on) return NO_WEEK_SELECTED;

				const hrs = differenceInHours(new Date(), new Date(selected_on));

				if (hrs < 24) return week;

				return NO_WEEK_SELECTED;
			},
		},
		indexes: {},
	});
}

export const User = UserConditional;

export type TDeleteUserProps = { userId: string };
export const deleteUser = new ValidatedMethod<TDeleteUserProps>({
	name: 'Users.deleteUser',
	validate: new SimpleSchema({
		userId: { type: String, label: 'User ID' },
	}).validator(),
	run ({ userId }: TDeleteUserProps): void {
		const myUser = User.findOne(this.userId);
		const user = User.findOne(userId);

		if (!this.userId || !myUser.is_admin || user.years_played.length > 1)
			throw new Meteor.Error(
				'Users.deleteUser.notAuthorized',
				'Not authorized to this function',
			);

		if (Meteor.isServer) {
			user.remove();
			Meteor.call(
				'Picks.removeAllPicksForUser',
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ user_id: user._id },
				handleError,
			);
			Meteor.call(
				'Tiebreakers.removeAllTiebreakersForUser',
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ user_id: user._id },
				handleError,
			);
			Meteor.call(
				'SurvivorPicks.removeAllSurvivorPicksForUser',
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ user_id: user._id },
				handleError,
			);
		}
	},
});
export const deleteUserSync = Meteor.wrapAsync(deleteUser.call, deleteUser);

export const getAdminUsers = new ValidatedMethod<{}>({
	name: 'Users.getAdminUsers',
	validate: new SimpleSchema({}).validator(),
	run (): TUser[] {
		const users = User.find(
			{},
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ sort: { last_name: 1, first_name: 1 } },
		).fetch();

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		return users;
	},
});
export const getAdminUsersSync = Meteor.wrapAsync(
	getAdminUsers.call,
	getAdminUsers,
);

export const getAllLeagues = new ValidatedMethod<{}>({
	name: 'Users.getAllLeagues',
	validate: new SimpleSchema({}).validator(),
	run (): string[] {
		const users: TUser[] = User.find(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ done_registering: true },
			{ fields: { leagues: 1 } },
		).fetch();
		const leagues = chain(users)
			.map('leagues')
			.flatten()
			.uniq()
			.value();

		return leagues;
	},
});
export const getAllLeaguesSync = Meteor.wrapAsync(
	getAllLeagues.call,
	getAllLeagues,
);

export const getCurrentUser = new ValidatedMethod<{}>({
	name: 'Users.getCurrentUser',
	validate: new SimpleSchema({}).validator(),
	run (): TUser {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const user_id = this.userId;
		const currentUser = User.findOne(user_id);

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id || !currentUser)
			throw new Meteor.Error('You are not signed in');

		return currentUser;
	},
});
export const getCurrentUserSync = Meteor.wrapAsync(
	getCurrentUser.call,
	getCurrentUser,
);

export type TGetSurvivorUsersProps = { league: string };
export const getSurvivorUsers = new ValidatedMethod<TGetSurvivorUsersProps>({
	name: 'Users.getSurvivorUsers',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
	}).validator(),
	run ({ league }: TGetSurvivorUsersProps): TUser[] {
		const users = User.find(
			{ leagues: league, survivor: true },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ sort: { first_name: 1 } },
		).fetch();

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		return users;
	},
});
export const getSurvivorUsersSync = Meteor.wrapAsync(
	getSurvivorUsers.call,
	getSurvivorUsers,
);

export type TGetUserByIDProps = { user_id: string };
export const getUserByID = new ValidatedMethod<TGetUserByIDProps>({
	name: 'Users.getUserByID',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ user_id }: TGetUserByIDProps): TUser {
		return User.findOne(user_id);
	},
});
export const getUserByIDSync = Meteor.wrapAsync(getUserByID.call, getUserByID);

export type TGetUserNameProps = { user_id: string };
export const getUserName = new ValidatedMethod<TGetUserNameProps>({
	name: 'Users.getUserName',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ user_id }: TGetUserNameProps): string {
		const user = User.findOne(user_id);

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		if (!user) throw new Meteor.Error('No user found');

		return `${user.first_name} ${user.last_name}`;
	},
});
export const getUserNameSync = Meteor.wrapAsync(getUserName.call, getUserName);

export type TGetUsersFilters = {
	done_registering?: boolean;
	leagues?: string[];
};
export type TGetUsersProps = { activeOnly: boolean; league: string };
export const getUsers = new ValidatedMethod<TGetUsersProps>({
	name: 'Users.getUsers',
	validate: new SimpleSchema({
		activeOnly: { type: Boolean, label: 'Get Active Only', optional: true },
		league: { type: String, label: 'League', optional: true },
	}).validator(),
	run ({ activeOnly, league }: TGetUsersProps): TUser[] {
		const filter: TGetUsersFilters = {};

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (activeOnly) filter.done_registering = true;

		if (league) filter.leagues = [league];

		const activeUsers = User.find(filter).fetch();

		if (activeUsers.length === 0)
			throw new Meteor.Error('No active users found!');

		return activeUsers;
	},
});
export const getUsersSync = Meteor.wrapAsync(getUsers.call, getUsers);

export const getUsersForLogs = new ValidatedMethod<{}>({
	name: 'Users.getUsersForLogs',
	validate: new SimpleSchema({}).validator(),
	run (): TUser[] {
		const users = User.find(
			{},
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ sort: { first_name: 1, last_name: 1 } },
		).fetch();

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		return users;
	},
});
export const getUsersForLogsSync = Meteor.wrapAsync(
	getUsersForLogs.call,
	getUsersForLogs,
);

export type TNotifyAdminsOfUntrustedProps = { user_id: string };
export const notifyAdminsOfUntrusted = new ValidatedMethod<
	TNotifyAdminsOfUntrustedProps
>({
	name: 'Users.notifyAdminsOfUntrusted',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ user_id }: TNotifyAdminsOfUntrustedProps): void {
		if (Meteor.isServer) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			const admins: TUser[] = User.find({ is_admin: true }).fetch();
			const user: TUser = User.findOne(user_id);

			admins.forEach(
				(admin): void => {
					Meteor.call(
						'Email.sendEmail',
						{
							data: {
								admin,
								newUser: user,
								preview:
									'A new user requires confirmation to be able to participate',
							},
							subject: 'New User Requires Admin Approval',
							template: 'approveUser',
							to: admin.email,
						},
						handleError,
					);
				},
			);
		}
	},
});
export const notifyAdminsOfUntrustedSync = Meteor.wrapAsync(
	notifyAdminsOfUntrusted.call,
	notifyAdminsOfUntrusted,
);

export type TRemoveSelectedWeekProps = { userId: string };
export const removeSelectedWeek = new ValidatedMethod<TRemoveSelectedWeekProps>(
	{
		name: 'Users.selected_week.delete',
		validate: new SimpleSchema({
			userId: { type: String, label: 'User ID' },
		}).validator(),
		run ({ userId }: TRemoveSelectedWeekProps): void {
			if (!userId)
				throw new Meteor.Error(
					'Users.selected_week.delete.notLoggedIn',
					'Must be logged in to change week',
				);

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (Meteor.isServer) User.update(userId, { $set: { selected_week: {} } });
		},
	},
);
export const removeSelectedWeekSync = Meteor.wrapAsync(
	removeSelectedWeek.call,
	removeSelectedWeek,
);

export type TResetUserProps = {
	isDropOut?: boolean;
	userId: string;
};
export const resetUser = new ValidatedMethod<TResetUserProps>({
	name: 'Users.resetUser',
	validate: new SimpleSchema({
		userId: { type: String, label: 'User ID' },
		isDropOut: {
			type: Boolean,
			label: 'Drop out?',
			defaultValue: false,
			optional: true,
		},
	}).validator(),
	run ({ isDropOut = false, userId }: TResetUserProps): void {
		const user: TUser = User.findOne(userId);

		// eslint-disable-next-line @typescript-eslint/camelcase
		user.done_registering = false;
		user.leagues = [];
		user.survivor = false;
		user.owe = 0;
		user.paid = 0;
		// eslint-disable-next-line @typescript-eslint/camelcase
		user.selected_week = {} as any;
		// eslint-disable-next-line @typescript-eslint/camelcase
		user.total_points = 0;
		// eslint-disable-next-line @typescript-eslint/camelcase
		user.total_games = 0;
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		// eslint-disable-next-line @typescript-eslint/camelcase
		user.overall_place = undefined;
		// eslint-disable-next-line @typescript-eslint/camelcase
		user.overall_tied_flag = false;

		if (ACCOUNT_TYPES.indexOf(user.payment_type) === -1) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			user.payment_type = 'Zelle';
		}

		if (isDropOut) {
			const currentYear = getCurrentSeasonYear();

			// eslint-disable-next-line @typescript-eslint/camelcase
			user.years_played = user.years_played.filter(
				year => year !== currentYear,
			);

			Meteor.call(
				'Tiebreakers.removeAllTiebreakersForUser',
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ user_id: userId },
				handleError,
			);
			Meteor.call(
				'Picks.removeAllPicksForUser',
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ user_id: userId },
				handleError,
			);
			Meteor.call(
				'SurvivorPicks.removeAllSurvivorPicksForUser',
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ user_id: userId },
				handleError,
			);
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		user.save();
	},
});
export const resetUserSync = Meteor.wrapAsync(resetUser.call, resetUser);

export type TSendAllPicksInEmailProps = { selectedWeek: TWeek };
export const sendAllPicksInEmail = new ValidatedMethod<
	TSendAllPicksInEmailProps
>({
	name: 'Users.sendAllPicksInEmail',
	validate: new SimpleSchema({
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ selectedWeek }: TSendAllPicksInEmailProps): void {
		if (Meteor.isServer) {
			const leagues: string[] = getAllLeagues.call({});

			leagues.forEach(
				(league): void => {
					if (!hasAllSubmitted.call({ league, week: selectedWeek })) return;

					console.log(
						`All picks have been submitted for week ${selectedWeek} in league ${league}, sending emails...`,
					);

					const leagueUsers: TUser[] = User.find({
						// eslint-disable-next-line @typescript-eslint/camelcase
						done_registering: true,
						leagues: league,
					}).fetch();

					leagueUsers.forEach(
						(user): void => {
							Meteor.call(
								'Email.sendEmail',
								{
									data: {
										preview: `This is your notice that all users in your league have now submitted their picks for week ${selectedWeek}`,
										user,
										week: selectedWeek,
									},
									subject: `All picks for week ${selectedWeek} have been submitted!`,
									template: 'allSubmit',
									to: user.email,
								},
								handleError,
							);
						},
					);

					console.log('All emails sent!');
				},
			);
		}
	},
});
export const sendAllPicksInEmailSync = Meteor.wrapAsync(
	sendAllPicksInEmail.call,
	sendAllPicksInEmail,
);

export type TSendWelcomeEmailProps = {
	isNewPlayer: boolean;
	userId: string;
};
export const sendWelcomeEmail = new ValidatedMethod<TSendWelcomeEmailProps>({
	name: 'Users.sendWelcomeEmail',
	validate: new SimpleSchema({
		isNewPlayer: { type: Boolean, label: 'New Player?' },
		userId: { type: String, label: 'User ID' },
	}).validator(),
	run ({ isNewPlayer, userId }: TSendWelcomeEmailProps): void {
		const user: TUser = User.findOne(userId);
		// eslint-disable-next-line @typescript-eslint/camelcase
		const admins: TUser[] = User.find({ is_admin: true }).fetch();
		const systemVals: TSystemVals = getSystemValues.call({});

		if (Meteor.isServer) {
			Meteor.call(
				'Email.sendEmail',
				{
					data: {
						preview:
							"This is an email sent to everyone signing up for this year's confidence pool",
						returning: !isNewPlayer,
						user,
						year: systemVals.year_updated,
					},
					subject: `Thanks for registering, ${user.first_name}!`,
					template: 'newUserWelcome',
					to: user.email,
				},
				handleError,
			);

			admins.forEach(
				(admin): void => {
					Meteor.call(
						'Email.sendEmail',
						{
							data: {
								admin,
								newUser: user,
								preview:
									'This is an auto generated notice that a new user has just finished registering',
							},
							subject: 'New User Registration',
							template: 'newUser',
							to: admin.email,
						},
						handleError,
					);
				},
			);
		}
	},
});
export const sendWelcomeEmailSync = Meteor.wrapAsync(
	sendWelcomeEmail.call,
	sendWelcomeEmail,
);

export type TUpdateNotificationsProps = {
	do_quick_pick: boolean;
	do_reminder: boolean;
	quick_pick_hours: number;
	reminder_hours: number;
	reminder_types_email: boolean;
	reminder_types_text: boolean;
};
export const updateNotifications = new ValidatedMethod<
	TUpdateNotificationsProps
>({
	name: 'Users.updateNotifications',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		do_quick_pick: { type: Boolean, label: 'Quick Pick?' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		do_reminder: { type: Boolean, label: 'Reminder?' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		quick_pick_hours: { type: Number, label: 'When to send quick pick' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		reminder_hours: { type: Number, label: 'When to send reminder' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		reminder_types_email: { type: Boolean, label: 'Send reminder as email?' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		reminder_types_text: { type: Boolean, label: 'Send reminder as text?' },
	}).validator(),
	run ({
		// eslint-disable-next-line @typescript-eslint/camelcase
		do_quick_pick,
		// eslint-disable-next-line @typescript-eslint/camelcase
		do_reminder,
		// eslint-disable-next-line @typescript-eslint/camelcase
		quick_pick_hours,
		// eslint-disable-next-line @typescript-eslint/camelcase
		reminder_hours,
		// eslint-disable-next-line @typescript-eslint/camelcase
		reminder_types_email,
		// eslint-disable-next-line @typescript-eslint/camelcase
		reminder_types_text,
	}: TUpdateNotificationsProps): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const user_id = this.userId;
		const currentUser = User.findOne(user_id);

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id)
			throw new Meteor.Error(
				'Users.updateNotifications.not-signed-in',
				'You are not signed in',
			);

		currentUser.notifications = [];

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (do_reminder) {
			const type = [];

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (reminder_types_email) type.push('email');

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (reminder_types_text) type.push('text');

			const reminder = new Notification({
				type,
				// eslint-disable-next-line @typescript-eslint/camelcase
				hours_before: reminder_hours,
				// eslint-disable-next-line @typescript-eslint/camelcase
				is_quick: false,
			});

			currentUser.notifications.push(reminder);
		}

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (do_quick_pick) {
			const quickPick = new Notification({
				type: ['email'],
				// eslint-disable-next-line @typescript-eslint/camelcase
				hours_before: quick_pick_hours,
				// eslint-disable-next-line @typescript-eslint/camelcase
				is_quick: true,
			});

			currentUser.notifications.push(quickPick);
		}

		currentUser.save();
	},
});
export const updateNotificationsSync = Meteor.wrapAsync(
	updateNotifications.call,
	updateNotifications,
);

export type TUpdatePlacesProps = { league: string; week: TWeek };
export const updatePlaces = new ValidatedMethod<TUpdatePlacesProps>({
	name: 'Users.tiebreakers.updatePlaces',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week' },
	}).validator(),
	run ({ league, week }: TUpdatePlacesProps): void {
		const ordTiebreakers: TTiebreaker[] = getAllTiebreakersForWeek
			.call({ league, week })
			.sort(weekPlacer);

		ordTiebreakers.forEach(
			(tiebreaker, i, allTiebreakers): void => {
				let currPlace = i + 1;
				let result;

				if (!tiebreaker.tied_flag || i === 0) {
					// eslint-disable-next-line @typescript-eslint/camelcase
					tiebreaker.place_in_week = currPlace;
				} else {
					currPlace = tiebreaker.place_in_week || 0;
				}

				const nextTiebreaker = allTiebreakers[i + 1];

				if (nextTiebreaker) {
					result = weekPlacer(tiebreaker, nextTiebreaker);

					if (result === 0) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						tiebreaker.tied_flag = true;
						// eslint-disable-next-line @typescript-eslint/camelcase
						nextTiebreaker.place_in_week = currPlace;
						// eslint-disable-next-line @typescript-eslint/camelcase
						nextTiebreaker.tied_flag = true;
					} else {
						// eslint-disable-next-line @typescript-eslint/camelcase
						if (i === 0) tiebreaker.tied_flag = false;

						// eslint-disable-next-line @typescript-eslint/camelcase
						nextTiebreaker.tied_flag = false;
					}

					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					nextTiebreaker.save();
				}

				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				tiebreaker.save();
			},
		);

		// Now, get and sort users for overall placing
		const ordUsers: TUser[] = User.find({
			// eslint-disable-next-line @typescript-eslint/camelcase
			done_registering: true,
			leagues: league,
		})
			.fetch()
			.sort(overallPlacer);

		ordUsers.forEach(
			(user, i, allUsers): void => {
				let currPlace = i + 1;
				let result;

				// eslint-disable-next-line @typescript-eslint/camelcase
				if (!user.overall_tied_flag || i === 0) {
					// eslint-disable-next-line @typescript-eslint/camelcase
					user.overall_place = currPlace;
				} else {
					// eslint-disable-next-line @typescript-eslint/camelcase
					currPlace = user.overall_place;
				}

				const nextUser = allUsers[i + 1];

				if (nextUser) {
					result = overallPlacer(user, nextUser);

					if (result === 0) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user.overall_tied_flag = true;
						// eslint-disable-next-line @typescript-eslint/camelcase
						nextUser.overall_place = currPlace;
						// eslint-disable-next-line @typescript-eslint/camelcase
						nextUser.overall_tied_flag = true;
					} else {
						// eslint-disable-next-line @typescript-eslint/camelcase
						if (i === 0) user.overall_tied_flag = false;

						// eslint-disable-next-line @typescript-eslint/camelcase
						nextUser.overall_tied_flag = false;
					}
				}
			},
		);

		// 2016-09-13 Moved saving to end to try and prevent endless loading screen upon game updates
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		ordUsers.forEach(user => user.save());
	},
});
export const updatePlacesSync = Meteor.wrapAsync(
	updatePlaces.call,
	updatePlaces,
);

export type TUpdatePointsProps = { league: string };
export const updatePoints = new ValidatedMethod<TUpdatePointsProps>({
	name: 'Users.updatePoints',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
	}).validator(),
	run ({ league }: TUpdatePointsProps): void {
		const allUsers: TUser[] = User.find({
			// eslint-disable-next-line @typescript-eslint/camelcase
			done_registering: true,
			leagues: league,
		});
		let picks: TPick[];
		let tiebreakers: TTiebreaker[];
		let games: number;
		let points: number;
		let weekGames: number[];
		let weekPoints: number[];

		allUsers.forEach(
			(user): void => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				picks = getAllPicksForUser.call({ league, user_id: user._id });
				tiebreakers = getAllTiebreakersForUser.call({
					league,
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: user._id,
				});
				games = 0;
				points = 0;
				weekGames = new Array(18).fill(0);
				weekPoints = new Array(18).fill(0);

				picks.forEach(
					(pick): void => {
						if (pick.winner_id && pick.pick_id === pick.winner_id) {
							games++;
							points += pick.points || 0;

							if (!weekGames[pick.week]) weekGames[pick.week] = 0;

							weekGames[pick.week] += 1;

							if (!weekPoints[pick.week]) weekPoints[pick.week] = 0;

							weekPoints[pick.week] += pick.points || 0;
						}
					},
				);

				tiebreakers.forEach(
					(week): void => {
						// eslint-disable-next-line @typescript-eslint/camelcase
						week.games_correct = weekGames[week.week];
						// eslint-disable-next-line @typescript-eslint/camelcase
						week.points_earned = weekPoints[week.week];
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						week.save();
					},
				);

				// eslint-disable-next-line @typescript-eslint/camelcase
				user.total_games = games;
				// eslint-disable-next-line @typescript-eslint/camelcase
				user.total_points = points;
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				user.save();
			},
		);
	},
});
export const updatePointsSync = Meteor.wrapAsync(
	updatePoints.call,
	updatePoints,
);

export type TUpdateSelectedWeekProps = { week: TWeek };
export const updateSelectedWeek = new ValidatedMethod<TUpdateSelectedWeekProps>(
	{
		name: 'Users.selected_week.update',
		validate: new SimpleSchema({
			week: { type: Number, label: 'Week' },
		}).validator(),
		run ({ week }: TUpdateSelectedWeekProps): void {
			if (!this.userId)
				throw new Meteor.Error(
					'Users.selected_week.update.notLoggedIn',
					'Must be logged in to choose week',
				);

			if (Meteor.isServer) {
				User.update(this.userId, {
					$set: {
						'selected_week.week': week,
						'selected_week.selected_on': new Date(),
					},
				});
			} else if (Meteor.isClient) {
				Session.set('selectedWeek', week);
			}
		},
	},
);
export const updateSelectedWeekSync = Meteor.wrapAsync(
	updateSelectedWeek.call,
	updateSelectedWeek,
);

export type TUpdateSurvivorProps = { league: string; week: TWeek };
export const updateSurvivor = new ValidatedMethod<TUpdateSurvivorProps>({
	name: 'Users.survivor.update',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week' },
	}).validator(),
	run ({ league, week }: TUpdateSurvivorProps): void {
		const allUsers: TUser[] = User.find({
			// eslint-disable-next-line @typescript-eslint/camelcase
			done_registering: true,
			leagues: league,
		}).fetch();
		let wasAlive = 0;
		let nowAlive = 0;

		allUsers.forEach(
			(user): void => {
				const survivorPicks: TSurvivorPick[] = getMySurvivorPicks.call({
					league,
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: user._id,
				});
				let alive = survivorPicks.length === 17;

				if (!alive) return;

				wasAlive++;

				survivorPicks.every((pick, i) => {
					if (!pick.pick_id && pick.week <= week) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						pick.winner_id = 'MISSED';
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						pick.save();
					}

					if (pick.winner_id && pick.pick_id !== pick.winner_id) alive = false;

					if (!alive) {
						markUserDead.call({
							league,
							// eslint-disable-next-line @typescript-eslint/camelcase
							user_id: pick.user_id,
							weekDead: pick.week,
						});

						return false;
					}

					nowAlive++;

					return true;
				});
			},
		);

		if (nowAlive === 0 && wasAlive > 0)
			Meteor.call('NFLLogs.endOfSurvivorMessage', { league }, handleError);
	},
});
export const updateSurvivorSync = Meteor.wrapAsync(
	updateSurvivor.call,
	updateSurvivor,
);

export type TUpdateUserProps = {
	auto_pick_strategy?: TAutoPickStrategy;
	done_registering?: boolean;
	first_name: string;
	last_name: string;
	leagues: string[];
	payment_account: string;
	payment_type: TPaymentType;
	phone_number: string;
	referred_by?: string;
	survivor?: boolean;
	team_name: string;
};
export const updateUser = new ValidatedMethod<TUpdateUserProps>({
	name: 'Users.updateUser',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		auto_pick_strategy: {
			type: String,
			label: 'Auto Pick Strategy',
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		done_registering: {
			type: Boolean,
			label: 'Done Registering?',
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		first_name: { type: String, label: 'First Name' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		last_name: { type: String, label: 'Last Name' },
		leagues: { type: [String], label: 'Leagues', optional: true },
		// eslint-disable-next-line @typescript-eslint/camelcase
		payment_account: { type: String, label: 'Payment Account' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		payment_type: { type: String, label: 'Payment Type' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		phone_number: { type: String, label: 'Phone Number' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		referred_by: { type: String, label: 'Referred By', optional: true },
		survivor: { type: Boolean, label: 'Has Survivior?', optional: true },
		// eslint-disable-next-line @typescript-eslint/camelcase
		team_name: { type: String, label: 'Team Name' },
	}).validator(),
	run (userObj: TUpdateUserProps): void {
		const systemVals: TSystemVals = getSystemValues.call({});
		// eslint-disable-next-line @typescript-eslint/camelcase
		const { year_updated } = systemVals;
		let user: TUser;

		if (!this.userId)
			throw new Meteor.Error(
				'Users.updateUser.not-logged-in',
				'Must be logged in to change profile',
			);

		user = User.findOne(this.userId);

		const isNewPlayer = !user.trusted;
		const isCreate = !user.done_registering;

		user = Object.assign(user, userObj);

		if (userObj.done_registering != null)
			user.trusted = userObj.done_registering;

		if (isCreate && userObj.done_registering) {
			user.owe = POOL_COST;
			// eslint-disable-next-line @typescript-eslint/camelcase
			user.auto_pick_count = DEFAULT_AUTO_PICK_COUNT;

			Meteor.call('Games.getEmptyUserTiebreakers', {
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: user._id,
				leagues: user.leagues,
			});
			Meteor.call('Games.getEmptyUserPicks', {
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: user._id,
				leagues: user.leagues,
			});

			if (user.survivor) {
				user.owe += SURVIVOR_COST;

				Meteor.call('Games.getEmptyUserSurvivorPicks', {
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: user._id,
					leagues: user.leagues,
				});
			}

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (!user.years_played) user.years_played = [];

			// eslint-disable-next-line @typescript-eslint/camelcase
			user.years_played.push(year_updated);
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			user.save();
			sendWelcomeEmail.call({ isNewPlayer, userId: this.userId }, handleError);
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		user.save();
	},
});
export const updateUserSync = Meteor.wrapAsync(updateUser.call, updateUser);

export type TUpdateUserAdminProps = {
	done_registering?: boolean;
	isAdmin?: boolean;
	paid?: number;
	survivor?: boolean;
	userId: string;
};
export const updateUserAdmin = new ValidatedMethod<TUpdateUserAdminProps>({
	name: 'Users.updateAdmin',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		done_registering: {
			type: Boolean,
			label: 'Done Registering?',
			optional: true,
		},
		isAdmin: { type: Boolean, label: 'Is Administrator', optional: true },
		paid: { type: Number, label: 'Amount Paid', optional: true },
		survivor: { type: Boolean, label: 'Has Survivor', optional: true },
		userId: { type: String, label: 'User ID' },
	}).validator(),
	run ({
		// eslint-disable-next-line @typescript-eslint/camelcase
		done_registering,
		isAdmin,
		paid,
		survivor,
		userId,
	}: TUpdateUserAdminProps): void {
		const myUser: TUser = User.findOne(this.userId);
		const user: TUser = User.findOne(userId);
		const systemVals: TSystemVals = getSystemValues.call({});
		// eslint-disable-next-line @typescript-eslint/camelcase
		const { year_updated } = systemVals;
		let isNewPlayer;

		if (!this.userId || !myUser.is_admin)
			throw new Meteor.Error(
				'Users.update.notLoggedIn',
				'Not authorized to admin functions',
			);

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (done_registering != null) {
			isNewPlayer = !user.trusted;
			user.trusted = true;
			// eslint-disable-next-line @typescript-eslint/camelcase
			user.years_played = [year_updated];

			if (Meteor.isServer) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				if (!user.done_registering && done_registering) {
					user.owe = POOL_COST;
					// eslint-disable-next-line @typescript-eslint/camelcase
					user.auto_pick_count = DEFAULT_AUTO_PICK_COUNT;
					Meteor.call('Games.getEmptyUserPicks', {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id: user._id,
						leagues: user.leagues,
					});
					Meteor.call('Games.getEmptyUserTiebreakers', {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id: user._id,
						leagues: user.leagues,
					});

					if (survivor == null && user.survivor) {
						user.owe += SURVIVOR_COST;
						Meteor.call('Games.getEmptyUserSurvivorPicks', {
							// eslint-disable-next-line @typescript-eslint/camelcase
							user_id: user._id,
							leagues: user.leagues,
						});
					}

					sendWelcomeEmail.call({ isNewPlayer, userId }, handleError);
				}
			}

			// eslint-disable-next-line @typescript-eslint/camelcase
			user.done_registering = done_registering;
		}

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (isAdmin != null) user.is_admin = isAdmin;

		if (paid != null) {
			user.paid = paid;

			if (paid)
				writeLog.call(
					{
						action: 'PAID',
						message: `${user.first_name} ${user.last_name} has paid`,
						userId,
					},
					handleError,
				);
		}

		if (survivor != null) {
			user.survivor = survivor;

			if (Meteor.isServer) {
				if (user.done_registering) {
					if (survivor) {
						user.owe += SURVIVOR_COST;
						Meteor.call('Games.getEmptyUserSurvivorPicks', {
							// eslint-disable-next-line @typescript-eslint/camelcase
							user_id: user._id,
							leagues: user.leagues,
						});
					} else {
						user.owe -= SURVIVOR_COST;
						Meteor.call('SurvivorPicks.removeAllSurvivorPicksForUser', {
							// eslint-disable-next-line @typescript-eslint/camelcase
							user_id: user._id,
						});
					}
				}
			}
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		user.save();
	},
});
export const updateUserAdminSync = Meteor.wrapAsync(
	updateUserAdmin.call,
	updateUserAdmin,
);

export type TUpdateUserSurvivorProps = { survivor: boolean };
export const updateUserSurvivor = new ValidatedMethod<TUpdateUserSurvivorProps>(
	{
		name: 'Users.updateUserSurvivor',
		validate: new SimpleSchema({
			survivor: { type: Boolean, label: 'Join Survivor' },
		}).validator(),
		run ({ survivor }: TUpdateUserSurvivorProps): void {
			const user = User.findOne(this.userId);

			if (!this.userId)
				throw new Meteor.Error(
					'Users.updateUserSurvivor.notLoggedIn',
					'Not signed in to pool',
				);

			user.survivor = survivor;

			if (Meteor.isServer) {
				if (survivor) {
					user.owe += SURVIVOR_COST;
					Meteor.call('Games.getEmptyUserSurvivorPicks', {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id: user._id,
						leagues: user.leagues,
					});
				} else {
					user.owe -= SURVIVOR_COST;
					Meteor.call('SurvivorPicks.removeAllSurvivorPicksForUser', {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id: user._id,
					});
				}
			}

			user.save();
		},
	},
);
export const updateUserSurvivorSync = Meteor.wrapAsync(
	updateUserSurvivor.call,
	updateUserSurvivor,
);

export type TValidateReferredByProps = {
	referred_by: string;
	user_id?: string;
};
export const validateReferredBy = new ValidatedMethod<TValidateReferredByProps>(
	{
		name: 'Users.validateReferredBy',
		validate: new SimpleSchema({
			// eslint-disable-next-line @typescript-eslint/camelcase
			referred_by: { type: String, label: 'Referred By' },
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: { type: String, label: 'User ID', optional: true },
		}).validator(),
		run ({
			// eslint-disable-next-line @typescript-eslint/camelcase
			referred_by,
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id = this.userId,
		}: TValidateReferredByProps): boolean {
			const currentUser: TUser = User.findOne(user_id);
			const allUsers: TUser[] = User.find({ trusted: true }).fetch();

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (!user_id)
				throw new Meteor.Error(
					'Users.validateReferredBy.not-signed-in',
					'You are not signed in',
				);

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (currentUser.referred_by === referred_by) return true;

			const foundUsers = allUsers.filter(
				(user): boolean => {
					// eslint-disable-next-line @typescript-eslint/camelcase
					const { first_name, last_name } = user;
					// eslint-disable-next-line @typescript-eslint/camelcase
					const fullName = `${first_name.trim()} ${last_name.trim()}`.toLowerCase();

					// eslint-disable-next-line @typescript-eslint/camelcase
					if (user._id === user_id) return false;

					if (!user.trusted) return false;

					// eslint-disable-next-line @typescript-eslint/camelcase
					return fullName === referred_by.trim().toLowerCase();
				},
			);

			return foundUsers.length > 0;
		},
	},
);
export const validateReferredBySync = Meteor.wrapAsync(
	validateReferredBy.call,
	validateReferredBy,
);
