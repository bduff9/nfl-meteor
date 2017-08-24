/* globals API */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Game } from '../../imports/api/collections/games';
import { addPick, removeAllPicksForUser } from './picks';
import { addSurvivorPick, removeAllSurvivorPicksForUser } from './survivorpicks';
import { addTiebreaker, removeAllTiebreakersForUser } from './tiebreakers';

/**
 * All server side game logic
 */

export const clearGames = new ValidatedMethod({
	name: 'Games.clearGames',
	validate: new SimpleSchema({}).validator(),
	run () {
		Game.remove({});
	}
});
export const clearGamesSync = Meteor.wrapAsync(clearGames.call, clearGames);

export const getEmptyUserPicks = new ValidatedMethod({
	name: 'Games.getEmptyUserPicks',
	validate: new SimpleSchema({
		leagues: { type: [String], label: 'Leagues' },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ leagues, user_id }) {
		leagues.forEach(league => {
			const picks = Game.find({}, { sort: { week: 1, game: 1 }}).map(game => {
				return {
					user_id,
					league,
					week: game.week,
					game_id: game._id,
					game: game.game
				};
			});
			removeAllPicksForUser.call({ league, user_id });
			picks.forEach(pick => {
				addPick.call({ pick });
			});
		});
	}
});
export const getEmptyUserPicksSync = Meteor.wrapAsync(getEmptyUserPicks.call, getEmptyUserPicks);

export const getEmptyUserSurvivorPicks = new ValidatedMethod({
	name: 'Games.getEmptyUserSurvivorPicks',
	validate: new SimpleSchema({
		leagues: { type: [String], label: 'Leagues' },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ leagues, user_id }) {
		leagues.forEach(league => {
			const survivorPicks = Game.find({ game: 1 }, { sort: { week: 1 }}).map(game => {
				return {
					user_id,
					league,
					week: game.week
				};
			});
			removeAllSurvivorPicksForUser.call({ league, user_id });
			survivorPicks.forEach(survivorPick => addSurvivorPick.call({ survivorPick }));
		});
	}
});
export const getEmptyUserSurvivorPicksSync = Meteor.wrapAsync(getEmptyUserSurvivorPicks.call, getEmptyUserSurvivorPicks);

export const getEmptyUserTiebreakers = new ValidatedMethod({
	name: 'Games.getEmptyUserTiebreakers',
	validate: new SimpleSchema({
		leagues: { type: [String], label: 'Leagues' },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ leagues, user_id }) {
		leagues.forEach(league => {
			const tiebreakers = Game.find({ game: 1 }, { sort: { week: 1 }}).map(game => {
				return {
					user_id,
					league,
					week: game.week
				};
			});
			removeAllTiebreakersForUser.call({ league, user_id });
			tiebreakers.forEach(tiebreaker => {
				addTiebreaker.call({ tiebreaker });
			});
		});
	}
});
export const getEmptyUserTiebreakersSync = Meteor.wrapAsync(getEmptyUserTiebreakers.call, getEmptyUserTiebreakers);

export const initSchedule = new ValidatedMethod({
	name: 'Games.insert',
	validate: new SimpleSchema({}).validator(),
	run () {
		API.populateGames();
	}
});
export const initScheduleSync = Meteor.wrapAsync(initSchedule.call, initSchedule);

export const refreshGames = new ValidatedMethod({
	name: 'Games.refreshGameData',
	validate: new SimpleSchema({}).validator(),
	run () {
		const gamesInProgress = Game.find({ game: { $ne: 0 }, status: { $ne: 'C' }, kickoff: { $lte: new Date() }}).count();
		if (gamesInProgress === 0) throw new Meteor.Error('No games found', 'There are no games currently in progress');
		return API.refreshGameData();
	}
});
export const refreshGamesSync = Meteor.wrapAsync(refreshGames.call, refreshGames);

export const removeBonusPointGames = new ValidatedMethod({
	name: 'Games.removeBonusPointGames',
	validate: new SimpleSchema({}).validator(),
	run () {
		Game.remove({ game: 0 }, { multi: true });
	}
});
export const removeBonusPointGamesSync = Meteor.wrapAsync(removeBonusPointGames.call, removeBonusPointGames);
