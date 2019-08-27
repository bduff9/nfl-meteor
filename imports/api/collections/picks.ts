import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { TWeek, TGameNumber, TAutoPickStrategy } from '../commonTypes';
import { dbVersion } from '../constants';
import { getNextPointValue, handleError } from '../global';

import { gameHasStarted, getGameByID, TGame } from './games';
import { getTeamByID, TTeam } from './teams';
import { getUserByID, TUser } from './users';

export type TPick = {
	_id: string;
	user_id: string;
	league: string;
	week: TWeek;
	game_id: string;
	game: TGameNumber;
	pick_id?: string | null;
	pick_short?: string | null;
	points?: number | null;
	winner_id?: string | null;
	winner_short?: string | null;
	getGame: () => TGame;
	getTeam: () => TTeam;
	getUser: () => TUser;
	hasStarted: () => boolean;
};

let PicksConditional = null;
let PickConditional = null;

if (dbVersion < 2) {
	PickConditional = Class.create({
		name: 'Pick',
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
			game_id: String,
			game: {
				type: Number,
				validators: [
					{
						type: 'and',
						param: [
							{ type: 'required' },
							{ type: 'gte', param: 0 },
							{ type: 'lte', param: 16 },
						],
					},
				],
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
			points: {
				type: Number,
				validators: [
					{
						type: 'and',
						param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 16 }],
					},
				],
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
			hasStarted (): boolean {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				return gameHasStarted.call({ gameId: this.game_id });
			},
			getTeam (): TTeam {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const team: TTeam = getTeamByID.call({ teamId: this.pick_id });

				return team;
			},
		},
	});
} else {
	PicksConditional = new Mongo.Collection('picks');
	PickConditional = Class.create({
		name: 'Pick',
		collection: PicksConditional,
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
			game_id: String,
			game: {
				type: Number,
				validators: [
					{
						type: 'and',
						param: [
							{ type: 'required' },
							{ type: 'gte', param: 0 },
							{ type: 'lte', param: 16 },
						],
					},
				],
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
			points: {
				type: Number,
				validators: [
					{
						type: 'and',
						param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 16 }],
					},
				],
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
			getGame (): TGame {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const game = getGameByID.call({ gameId: this.game_id });

				return game;
			},
			getTeam (): TTeam {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const team: TTeam = getTeamByID.call({ teamId: this.pick_id });

				return team;
			},
			getUser (): TUser {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user: TUser = getUserByID.call({ user_id: this.user_id });

				return user;
			},
			hasStarted (): boolean {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				return gameHasStarted.call({ gameId: this.game_id });
			},
		},
		indexes: {
			onePick: {
				fields: {
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: 1,
					league: 1,
					week: 1,
					game: 1,
				},
				options: {
					unique: true,
				},
			},
			onePick2: {
				fields: {
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: 1,
					league: 1,
					// eslint-disable-next-line @typescript-eslint/camelcase
					game_id: 1,
				},
				options: {
					unique: true,
				},
			},
		},
	});
}

export const Picks = PicksConditional;
export const Pick = PickConditional;

/**
 * All pick logic
 * @since 2017-06-26
 */

const isAutoPickHome = (strategy: TAutoPickStrategy): boolean => {
	if (strategy === 'Home') return true;

	if (strategy === 'Away') return false;

	if (strategy === 'Random') return Math.random() < 0.5;

	throw new Meteor.Error(
		`Invalid strategy found (${strategy}), this should be impossible!`,
	);
};

export type TAssignPointsToMissedProps = { gameId: string; week: TWeek };
export const assignPointsToMissed = new ValidatedMethod<
	TAssignPointsToMissedProps
>({
	name: 'Picks.assignPointsToMissed',
	validate: new SimpleSchema({
		gameId: { type: String, label: 'Game ID' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ gameId, week }: TAssignPointsToMissedProps): void {
		if (Meteor.isServer) {
			const missedPicks: TPick[] = Pick.find({
				// eslint-disable-next-line @typescript-eslint/camelcase
				game_id: gameId,
				points: null,
			}).fetch();

			if (missedPicks.length)
				console.log(
					`${missedPicks.length} users missed game ${gameId} in week ${week}`,
				);

			missedPicks.forEach(
				(missedPick): void => {
					// eslint-disable-next-line @typescript-eslint/camelcase
					const { league, user_id } = missedPick;
					const user = missedPick.getUser();
					// eslint-disable-next-line @typescript-eslint/camelcase
					const { auto_pick_count, auto_pick_strategy } = user;
					const game = missedPick.getGame();
					// eslint-disable-next-line @typescript-eslint/camelcase
					const usersPicks = Pick.find({ league, user_id, week }).fetch();
					const pointVal = getNextPointValue(usersPicks, user);

					missedPick.points = pointVal;

					// eslint-disable-next-line @typescript-eslint/camelcase
					if (auto_pick_strategy && auto_pick_count > 0) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user.auto_pick_count -= 1;
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						user.save();

						// eslint-disable-next-line @typescript-eslint/camelcase
						if (isAutoPickHome(auto_pick_strategy)) {
							// eslint-disable-next-line @typescript-eslint/camelcase
							missedPick.pick_id = game.home_id;
							// eslint-disable-next-line @typescript-eslint/camelcase
							missedPick.pick_short = game.home_short;
						} else {
							// eslint-disable-next-line @typescript-eslint/camelcase
							missedPick.pick_id = game.visitor_id;
							// eslint-disable-next-line @typescript-eslint/camelcase
							missedPick.pick_short = game.visitor_short;
						}

						console.log(
							// eslint-disable-next-line @typescript-eslint/camelcase
							`Auto picked ${auto_pick_strategy} team for ${pointVal} points for user ${user_id}`,
						);
					} else {
						// eslint-disable-next-line @typescript-eslint/camelcase
						console.log(`Auto assigned ${pointVal} points to user ${user_id}`);
					}

					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					missedPick.save();
				},
			);
		}
	},
});
export const assignPointsToMissedSync = Meteor.wrapAsync(
	assignPointsToMissed.call,
	assignPointsToMissed,
);

export type TAutoPickProps = {
	available: number[];
	league: string;
	selectedWeek: TWeek;
	type: TAutoPickStrategy;
};
export const autoPick = new ValidatedMethod<TAutoPickProps>({
	name: 'Picks.autoPick',
	validate: new SimpleSchema({
		available: {
			type: [Number],
			label: 'Available Points',
			minCount: 1,
			maxCount: 16,
		},
		league: { type: String, label: 'League' },
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
		type: {
			type: String,
			label: 'Auto Pick Type',
			allowedValues: ['Home', 'Away', 'Random'],
		},
	}).validator(),
	run ({ available, league, selectedWeek, type }: TAutoPickProps): void {
		if (!this.userId)
			throw new Meteor.Error(
				'Picks.autoPick.notLoggedIn',
				'Must be logged in to update picks',
			);

		if (Meteor.isServer) {
			const picks: TPick[] = Pick.find({
				league,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: this.userId,
				week: selectedWeek,
			}).fetch();
			const pointsLeft = Object.assign([], available);
			let game;
			let teamId: string;
			let teamShort: string;
			let pointIndex;
			let point;

			picks.forEach(
				(pick): void => {
					if (!pick.hasStarted() && !pick.pick_id) {
						game = getGameByID.call({ gameId: pick.game_id });

						if (isAutoPickHome(type)) {
							teamId = game.home_id;
							teamShort = game.home_short;
						} else {
							teamId = game.visitor_id;
							teamShort = game.visitor_short;
						}

						pointIndex = Math.floor(Math.random() * pointsLeft.length);
						point = pointsLeft.splice(pointIndex, 1);
						// eslint-disable-next-line @typescript-eslint/camelcase
						pick.pick_id = teamId;
						// eslint-disable-next-line @typescript-eslint/camelcase
						pick.pick_short = teamShort;
						pick.points = point[0];
					}
				},
			);

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			picks.forEach((pick): void => pick.save());
		}
	},
});
export const autoPickSync = Meteor.wrapAsync(autoPick.call, autoPick);

export type TGetAllPicksProps = { league: string };
export const getAllPicks = new ValidatedMethod<TGetAllPicksProps>({
	name: 'Picks.getAllPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
	}).validator(),
	run ({ league }: TGetAllPicksProps): TPick[] {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const user_id = this.userId;
		const picks = Pick.find(
			{ league },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ sort: { user_id: 1, week: 1, game: 1 } },
		).fetch();

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id) throw new Meteor.Error('You are not signed in!');

		if (!picks) throw new Meteor.Error('No picks found');

		return picks;
	},
});
export const getAllPicksSync = Meteor.wrapAsync(getAllPicks.call, getAllPicks);

export type TGetAllPicksForUserProps = { league: string; user_id: string };
export const getAllPicksForUser = new ValidatedMethod<TGetAllPicksForUserProps>(
	{
		name: 'Picks.getAllPicksForUser',
		validate: new SimpleSchema({
			league: { type: String, label: 'League' },
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: { type: String, label: 'User ID' },
		}).validator(),
		// eslint-disable-next-line @typescript-eslint/camelcase
		run ({ league, user_id }: TGetAllPicksForUserProps): TPick[] {
			const picks = Pick.find(
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ league, user_id },
				{ sort: { week: 1, game: 1 } },
			).fetch();

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (!picks) throw new Meteor.Error(`No picks found for user ${user_id}`);

			return picks;
		},
	},
);
export const getAllPicksForUserSync = Meteor.wrapAsync(
	getAllPicksForUser.call,
	getAllPicksForUser,
);

export type TGetAllPicksForWeekProps = { league: string; week: TWeek };
export const getAllPicksForWeek = new ValidatedMethod<TGetAllPicksForWeekProps>(
	{
		name: 'Picks.getAllPicksForWeek',
		validate: new SimpleSchema({
			league: { type: String, label: 'League' },
			week: { type: Number, label: 'Week', min: 1, max: 17 },
		}).validator(),
		run ({ league, week }: TGetAllPicksForWeekProps): TPick[] {
			// eslint-disable-next-line @typescript-eslint/camelcase
			const user_id = this.userId;
			const picks = Pick.find(
				{ league, week },
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ sort: { user_id: 1, game: 1 } },
			).fetch();

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (!user_id) throw new Meteor.Error('You are not signed in!');

			if (!picks) throw new Meteor.Error(`No picks found for week ${week}`);

			return picks;
		},
	},
);
export const getAllPicksForWeekSync = Meteor.wrapAsync(
	getAllPicksForWeek.call,
	getAllPicksForWeek,
);

export type TGetPickForFirstGameOfWeekProps = {
	league: string;
	user_id: string;
	week: TWeek;
};
export const getPickForFirstGameOfWeek = new ValidatedMethod<
	TGetPickForFirstGameOfWeekProps
>({
	name: 'Picks.getPickForFirstGameOfWeek',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
		week: { type: Number, label: 'Week' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ league, user_id, week }: TGetPickForFirstGameOfWeekProps): TPick {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const firstGamePick = Pick.findOne({ game: 1, league, user_id, week });

		return firstGamePick;
	},
});
export const getPickForFirstGameOfWeekSync = Meteor.wrapAsync(
	getPickForFirstGameOfWeek.call,
	getPickForFirstGameOfWeek,
);

export type TGetPicksForWeekProps = {
	league: string;
	user_id?: string;
	week: TWeek;
};
export const getPicksForWeek = new ValidatedMethod<TGetPicksForWeekProps>({
	name: 'Picks.getPicksForWeek',
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
	}: TGetPicksForWeekProps): TPick[] {
		const picks = Pick.find(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ league, user_id, week },
			{ sort: { game: 1 } },
		).fetch();

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id) throw new Meteor.Error('You are not signed in!');

		if (!picks) throw new Meteor.Error(`No picks found for week ${week}`);

		return picks;
	},
});
export const getPicksForWeekSync = Meteor.wrapAsync(
	getPicksForWeek.call,
	getPicksForWeek,
);

export type TMigratePicksForUserProps = {
	newUserId: string;
	oldUserId: string;
};
export const migratePicksForUser = new ValidatedMethod<
	TMigratePicksForUserProps
>({
	name: 'Picks.migratePicksForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' },
	}).validator(),
	run ({ newUserId, oldUserId }: TMigratePicksForUserProps): void {
		Pick.update(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ user_id: oldUserId },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ $set: { user_id: newUserId } },
			{ multi: true },
		);
	},
});
export const migratePicksForUserSync = Meteor.wrapAsync(
	migratePicksForUser.call,
	migratePicksForUser,
);

export type TResetPicksProps = { league: string; selectedWeek: TWeek };
export const resetPicks = new ValidatedMethod<TResetPicksProps>({
	name: 'Picks.resetPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ league, selectedWeek }: TResetPicksProps): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const user_id = this.userId;
		let picks: TPick[];

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id)
			throw new Meteor.Error(
				'Not Logged In',
				'Must be logged in to reset picks',
			);

		if (Meteor.isServer) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			picks = Pick.find({ league, user_id, week: selectedWeek }).fetch();
			picks.forEach(
				(pick): void => {
					if (!pick.hasStarted()) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						pick.pick_id = undefined;
						// eslint-disable-next-line @typescript-eslint/camelcase
						pick.pick_short = undefined;
						pick.points = undefined;
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						pick.save();
					}
				},
			);
		}
	},
});
export const resetPicksSync = Meteor.wrapAsync(resetPicks.call, resetPicks);

export type TSetPickData = {
	gameId: string;
	teamId: string;
	teamShort: string;
};
export type TSetPickProps = {
	addOnly: boolean;
	fromData: TSetPickData;
	league: string;
	pointVal: number;
	removeOnly: boolean;
	selectedWeek: TWeek;
	toData: TSetPickData;
};
export const setPick = new ValidatedMethod<TSetPickProps>({
	name: 'Picks.add',
	validate: new SimpleSchema({
		addOnly: { type: Boolean, label: 'Add Only' },
		fromData: { type: Object, label: 'From List' },
		'fromData.gameId': { type: String, label: 'From Game ID', optional: true },
		'fromData.teamId': { type: String, label: 'From Team ID', optional: true },
		'fromData.teamShort': {
			type: String,
			label: 'From Team Name',
			optional: true,
		},
		league: { type: String, label: 'League' },
		pointVal: { type: Number, label: 'Points' },
		removeOnly: { type: Boolean, label: 'Remove Only' },
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
		toData: { type: Object, label: 'To List' },
		'toData.gameId': { type: String, label: 'To Game ID', optional: true },
		'toData.teamId': { type: String, label: 'To Team ID', optional: true },
		'toData.teamShort': { type: String, label: 'To Team Name', optional: true },
	}).validator(),
	run ({
		addOnly,
		fromData,
		league,
		pointVal,
		removeOnly,
		selectedWeek,
		toData,
	}: TSetPickProps): void {
		let pick;

		if (!this.userId)
			throw new Meteor.Error(
				'Users.picks.set.notLoggedIn',
				'Must be logged in to update picks',
			);

		if (
			fromData.gameId &&
			gameHasStarted.call({ gameId: fromData.gameId }, handleError)
		)
			throw new Meteor.Error(
				'Users.picks.set.gameAlreadyStarted',
				'This game has already begun',
			);

		if (
			toData.gameId &&
			gameHasStarted.call({ gameId: toData.gameId }, handleError)
		)
			throw new Meteor.Error(
				'Users.picks.set.gameAlreadyStarted',
				'This game has already begun',
			);

		if (Meteor.isServer) {
			if (!addOnly && fromData.gameId !== toData.gameId) {
				pick = Pick.findOne({
					// eslint-disable-next-line @typescript-eslint/camelcase
					game_id: fromData.gameId,
					league: league,
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: this.userId,
					week: selectedWeek,
				});
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick.pick_id = undefined;
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick.pick_short = undefined;
				pick.points = undefined;
				pick.save();
			}

			if (!removeOnly) {
				pick = Pick.findOne({
					// eslint-disable-next-line @typescript-eslint/camelcase
					game_id: toData.gameId,
					league: league,
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: this.userId,
					week: selectedWeek,
				});
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick.pick_id = toData.teamId;
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick.pick_short = toData.teamShort;
				pick.points = pointVal;
				pick.save();
			}
		}
	},
});
export const setPickSync = Meteor.wrapAsync(setPick.call, setPick);
