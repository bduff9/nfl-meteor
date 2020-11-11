import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import { Game, getNextGame1, TGame } from '../../imports/api/collections/games';
import { Pick, TPick } from '../../imports/api/collections/picks';
import { getTeamByShort, TTeam } from '../../imports/api/collections/teams';
import { getUserByID, TUser } from '../../imports/api/collections/users';
import { TWeek } from '../../imports/api/commonTypes';
import { getNextPointValue, handleError } from '../../imports/api/global';

export const addPick = new ValidatedMethod({
	name: 'Picks.addPick',
	validate: new SimpleSchema({
		pick: { type: Object, label: 'Pick', blackbox: true },
	}).validator(),
	run ({ pick }: { pick: TPick }): void {
		const newPick = new Pick(pick);

		newPick.save();
	},
});
export const addPickSync = Meteor.wrapAsync(addPick.call, addPick);

export const clearPicks = new ValidatedMethod({
	name: 'Picks.clearPicks',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		Pick.remove({});
	},
});
export const clearPicksSync = Meteor.wrapAsync(clearPicks.call, clearPicks);

export const doQuickPick = new ValidatedMethod({
	name: 'Picks.doQuickPick',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		team_short: { type: String, label: 'Team Short Name', min: 3, max: 3 },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	run ({
		// eslint-disable-next-line @typescript-eslint/camelcase
		team_short,
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id,
	}: {
		team_short: string;
		user_id: string;
	}): boolean {
		const game = (getNextGame1.call({}) as unknown) as TGame;
		// eslint-disable-next-line @typescript-eslint/camelcase
		const { _id: game_id, home_short, notFound, visitor_short, week } = game;
		let setPick = false;
		let user: TUser | null = null;
		let team;
		// eslint-disable-next-line @typescript-eslint/camelcase
		let team_id: string;
		let city;
		let name;

		try {
			// eslint-disable-next-line @typescript-eslint/camelcase
			user = (getUserByID.call({ user_id }) as unknown) as TUser;
			// eslint-disable-next-line @typescript-eslint/camelcase
			team = (getTeamByShort.call({
				// eslint-disable-next-line @typescript-eslint/camelcase
				short_name: team_short,
			}) as unknown) as TTeam;
			// eslint-disable-next-line @typescript-eslint/camelcase
			team_id = team._id;
			city = team.city;
			name = team.name;
		} catch (err) {
			throw new Meteor.Error(
				'Picks.doQuickPick.quickPickFailed',
				`Failed to do quick pick: ${err}`,
			);
		}

		if (!user) {
			throw new Meteor.Error(
				'Picks.doQuickPick.invalidUserID',
				'Invalid user ID! Please only use valid quick pick links.',
			);
		}

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!team_id)
			throw new Meteor.Error(
				'Picks.doQuickPick.invalidTeamID',
				// eslint-disable-next-line @typescript-eslint/camelcase
				`Invalid team (${team_short})!  Please only use valid quick pick links.`,
			);

		if (notFound || game.game !== 1)
			throw new Meteor.Error(
				'Picks.doQuickPick.noGameFound',
				'No game found!  Please try again later.',
			);

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (home_short !== team_short && visitor_short !== team_short)
			throw new Meteor.Error(
				'Picks.doQuickPick.invalidTeam',
				`Invalid team (${city} ${name})! Please only use valid quick pick links.`,
			);

		user.leagues.forEach(
			(league): void => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const thisPick = Pick.findOne({ league, game_id, user_id });
				// eslint-disable-next-line @typescript-eslint/camelcase
				const myPicks = Pick.find({ league, user_id, week }).fetch();

				if (thisPick.pick_id || thisPick.pick_short || thisPick.points) return;

				const nextPointValue = getNextPointValue(myPicks, user);

				setPick = true;
				// eslint-disable-next-line @typescript-eslint/camelcase
				thisPick.pick_id = team_id;
				// eslint-disable-next-line @typescript-eslint/camelcase
				thisPick.pick_short = team_short;
				thisPick.points = nextPointValue;

				thisPick.save();
			},
		);

		if (setPick) {
			Meteor.call(
				'Email.sendEmail',
				{
					data: {
						preview: 'Congrats!  Your quick pick was successfully saved!',
						team,
						user,
						week,
					},
					subject: `Your pick for week ${week} has been saved`,
					template: 'quickPickConfirm',
					to: user.email,
				},
				handleError,
			);
		} else {
			throw new Meteor.Error(
				'Picks.doQuickPick.pickAlreadySet',
				`Quick Pick failed!  Your game 1 picks for week ${week} have already been set`,
			);
		}

		return true;
	},
});
export const doQuickPickSync = Meteor.wrapAsync(doQuickPick.call, doQuickPick);

export const getPick = new ValidatedMethod({
	name: 'Picks.getPick',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		game_id: { type: String, label: 'Game ID' },
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	run ({
		// eslint-disable-next-line @typescript-eslint/camelcase
		game_id,
		league,
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id,
	}: {
		game_id: string;
		league: string;
		user_id: string;
	}): TPick {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const pick = Pick.findOne({ game_id, league, user_id });

		return pick;
	},
});
export const getPickSync = Meteor.wrapAsync(getPick.call, getPick);

export const removeAllPicksForUser = new ValidatedMethod({
	name: 'Picks.removeAllPicksForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League', optional: true },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ league, user_id }: { league: string; user_id: string }): void {
		if (league == null) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			Pick.remove({ user_id }, { multi: true });
		} else {
			// eslint-disable-next-line @typescript-eslint/camelcase
			Pick.remove({ league, user_id }, { multi: true });
		}
	},
});
export const removeAllPicksForUserSync = Meteor.wrapAsync(
	removeAllPicksForUser.call,
	removeAllPicksForUser,
);

export const removeBonusPointPicks = new ValidatedMethod({
	name: 'Games.removeBonusPointPicks',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		Pick.remove({ game: 0 }, { multi: true });
	},
});
export const removeBonusPointPicksSync = Meteor.wrapAsync(
	removeBonusPointPicks.call,
	removeBonusPointPicks,
);

export const fixUsersPicks = new ValidatedMethod({
	name: 'Games.fixUsersPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({
		league,
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id,
		week,
	}: {
		league: string;
		user_id: string;
		week: TWeek;
	}): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const picks: TPick[] = Pick.find({ league, user_id, week }).fetch();
		const games: TGame[] = Game.find({ week }).fetch();

		for (const pick of picks) {
			const gameID = pick.game_id;
			const found = games.find(({ _id }): boolean => _id === gameID);

			if (!found) {
				Pick.remove({ _id: pick._id });
			}
		}

		for (const game of games) {
			const gameID = game._id;
			// eslint-disable-next-line @typescript-eslint/camelcase
			const found = picks.find(({ game_id }): boolean => game_id === gameID);

			if (!found) {
				const newPick: TPick = new Pick({
					game: game.game,
					// eslint-disable-next-line @typescript-eslint/camelcase
					game_id: gameID,
					league,
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id,
					week,
				} as TPick);

				newPick.save();
			}
		}
	},
});
export const fixUsersPicksSync = Meteor.wrapAsync(
	fixUsersPicks.call,
	fixUsersPicks,
);

const movePointUp = (pick: TPick, picks: TPick[]): void => {
	if (pick.points === null || pick.points === undefined) return;

	const moveTo = pick.points + 1;
	const foundPick = picks.find(({ points }) => points === moveTo);

	if (foundPick) movePointUp(foundPick, picks);

	pick.points = moveTo;
	pick.save();
};

export const fixTooLowPoints = new ValidatedMethod({
	name: 'Games.fixTooLowPoints',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({
		league,
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id,
		week,
	}: {
		league: string;
		user_id: string;
		week: TWeek;
	}): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const picks: TPick[] = Pick.find({ league, user_id, week }).fetch();
		const lowest: TPick = picks.reduce((acc, pick): null | TPick => {
			if (pick.points == null) return acc;

			if (acc === null || acc.points == null || acc.points > pick.points)
				return pick;

			return acc;
		}, null);

		if (!lowest) return;

		const diff = 1 - (lowest.points || 1);

		for (let i = diff; i--; ) {
			movePointUp(lowest, picks);
		}
	},
});
export const fixTooLowPointsSync = Meteor.wrapAsync(
	fixTooLowPoints.call,
	fixTooLowPoints,
);

const movePointDown = (pick: TPick, picks: TPick[]): void => {
	if (pick.points === null || pick.points === undefined) return;

	const moveTo = pick.points - 1;
	const foundPick = picks.find(({ points }) => points === moveTo);

	if (foundPick) movePointDown(foundPick, picks);

	pick.points = moveTo;
	pick.save();
};

export const fixTooHighPoints = new ValidatedMethod({
	name: 'Games.fixTooHighPoints',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({
		league,
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id,
		week,
	}: {
		league: string;
		user_id: string;
		week: TWeek;
	}): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const picks: TPick[] = Pick.find({ league, user_id, week }).fetch();
		const highest = picks.reduce((acc, pick): null | TPick => {
			if (pick.points == null) return acc;

			if (acc === null || acc.points == null || acc.points < pick.points)
				return pick;

			return acc;
		}, null);

		if (!highest) return;

		const diff = (highest.points || picks.length) - picks.length;

		for (let i = diff; i--; ) {
			movePointDown(highest, picks);
		}
	},
});
export const fixTooHighPointsSync = Meteor.wrapAsync(
	fixTooHighPoints.call,
	fixTooHighPoints,
);
