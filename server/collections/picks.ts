import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import { getNextGame1 } from '../../imports/api/collections/games';
import { Pick, TPick } from '../../imports/api/collections/picks';
import { getTeamByShort } from '../../imports/api/collections/teams';
import { getUserByID, TUser } from '../../imports/api/collections/users';
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
		const game = getNextGame1.call({});
		// eslint-disable-next-line @typescript-eslint/camelcase
		const { _id: game_id, home_short, notFound, visitor_short, week } = game;
		let setPick = false;
		let user: TUser | null = null;
		let team;
		// eslint-disable-next-line @typescript-eslint/camelcase
		let team_id;
		let city;
		let name;

		try {
			// eslint-disable-next-line @typescript-eslint/camelcase
			user = getUserByID.call({ user_id });
			// eslint-disable-next-line @typescript-eslint/camelcase
			team = getTeamByShort.call({ short_name: team_short });
			// eslint-disable-next-line @typescript-eslint/camelcase
			team_id = team._id;
			city = team.city;
			name = team.name;
		} catch (err) {
			console.error('Failed to do quick pick', err);
		}

		if (!user)
			throw new Meteor.Error(
				'Picks.doQuickPick.invalidUserID',
				'Invalid user ID! Please only use valid quick pick links.',
			);

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
				let nextPointValue;

				if (thisPick.pick_id || thisPick.pick_short || thisPick.points) return;

				nextPointValue = getNextPointValue(myPicks, user);
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
