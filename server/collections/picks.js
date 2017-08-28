'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { handleError } from '../../imports/api/global';
import { getNextGame1 } from '../../imports/api/collections/games';
import { Pick } from '../../imports/api/collections/picks';
import { getTeamByShort } from '../../imports/api/collections/teams';
import { getUserByID } from '../../imports/api/collections/users';

export const addPick = new ValidatedMethod({
	name: 'Picks.addPick',
	validate: new SimpleSchema({
		pick: { type: Object, label: 'Pick', blackbox: true }
	}).validator(),
	run ({ pick }) {
		const newPick = new Pick(pick);
		newPick.save();
	}
});
export const addPickSync = Meteor.wrapAsync(addPick.call, addPick);

export const clearPicks = new ValidatedMethod({
	name: 'Picks.clearPicks',
	validate: new SimpleSchema({}).validator(),
	run () {
		Pick.remove({});
	}
});
export const clearPicksSync = Meteor.wrapAsync(clearPicks.call, clearPicks);

export const doQuickPick = new ValidatedMethod({
	name: 'Picks.doQuickPick',
	validate: new SimpleSchema({
		team_short: { type: String, label: 'Team Short Name', min: 3, max: 3 },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ team_short, user_id }) {
		const game = getNextGame1.call({}),
				{ _id: game_id, home_short, notFound, visitor_short, week } = game;
		let setPick = false, user, team, team_id, city, name;
		try {
			user = getUserByID.call({ user_id });
			team = getTeamByShort.call({ short_name: team_short });
			team_id = team._id;
			city = team.city;
			name = team.name;
		} catch (err) {
			console.error('Failed to do quick pick', err);
		}
		if (!user) throw new Meteor.Error('Picks.doQuickPick.invalidUserID', 'Invalid user ID! Please only use valid quick pick links.');
		if (!team_id) throw new Meteor.Error('Picks.doQuickPick.invalidTeamID', `Invalid team (${team_short})!  Please only use valid quick pick links.`);
		if (notFound || game.game !== 1) throw new Meteor.Error('Picks.doQuickPick.noGameFound', 'No game found!  Please try again later.');
		if (home_short !== team_short && visitor_short !== team_short) throw new Meteor.Error('Picks.doQuickPick.invalidTeam', `Invalid team (${city} ${name})! Please only use valid quick pick links.`);
		user.leagues.forEach(league => {
			const thisPick = Pick.findOne({ league, game_id, user_id }),
					myPicks = Pick.find({ league, user_id, week }).fetch(),
					pointsUsed = myPicks.filter(pick => pick.points).map(pick => pick.points);
			let highestPointVal = myPicks.length;
			if (thisPick.pick_id || thisPick.pick_short || thisPick.points) return;
			while (pointsUsed.indexOf(highestPointVal) > -1) highestPointVal--;
			setPick = true;
			thisPick.pick_id = team_id;
			thisPick.pick_short = team_short;
			thisPick.points = highestPointVal;
			thisPick.save();
		});
		if (setPick) {
			Meteor.call('Email.sendEmail', { data: { firstName: user.first_name, preview: 'Congrats!  Your quick pick was successfully saved!', week }, subject: `Your pick for week ${week} has been saved`, template: 'quickPickConfirm', to: user.email }, handleError);
		} else {
			throw new Meteor.Error('Picks.doQuickPick.pickAlreadySet', `Quick Pick failed!  Your game 1 picks for week ${week} have already been set`);
		}
		return true;
	}
});
export const doQuickPickSync = Meteor.wrapAsync(doQuickPick.call, doQuickPick);

export const removeAllPicksForUser = new ValidatedMethod({
	name: 'Picks.removeAllPicksForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League', optional: true },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ league, user_id }) {
		if (league == null) {
			Pick.remove({ user_id }, { multi: true });
		} else {
			Pick.remove({ league, user_id }, { multi: true });
		}
	}
});
export const removeAllPicksForUserSync = Meteor.wrapAsync(removeAllPicksForUser.call, removeAllPicksForUser);

export const removeBonusPointPicks = new ValidatedMethod({
	name: 'Games.removeBonusPointPicks',
	validate: new SimpleSchema({}).validator(),
	run () {
		Pick.remove({ game: 0 }, { multi: true });
	}
});
export const removeBonusPointPicksSync = Meteor.wrapAsync(removeBonusPointPicks.call, removeBonusPointPicks);
