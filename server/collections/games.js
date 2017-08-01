/* globals API */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Game } from '../../imports/api/collections/games';
import { addPickSync, removeAllPicksForUserSync } from './picks';
import { addSurvivorPickSync, removeAllSurvivorPicksForUserSync } from './survivorpicks';
import { addTiebreakerSync, removeAllTiebreakersForUserSync } from './tiebreakers';

/**
 * All server side game logic
 */

export const clearGames = new ValidatedMethod({
	name: 'Games.clearGames',
	validate: new SimpleSchema({}).validator(),
	run () {
		Game.remove({}, { multi: true });
	}
});
export const clearGamesSync = Meteor.wrapAsync(clearGames.call, clearGames);

export const getEmptyUserPicks = new ValidatedMethod({
	name: 'Game.getEmptyUserPicks',
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
			removeAllPicksForUserSync({ league, user_id });
			picks.forEach(pick => {
				addPickSync({ pick });
			});
		});
	}
});
export const getEmptyUserPicksSync = Meteor.wrapAsync(getEmptyUserPicks.call, getEmptyUserPicks);

export const getEmptyUserSurvivorPicks = new ValidatedMethod({
	name: 'Game.getEmptyUserSurvivorPicks',
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
			removeAllSurvivorPicksForUserSync({ league, user_id });
			survivorPicks.forEach(survivorPick => {
				addSurvivorPickSync({ survivorPick });
			});
		});
	}
});
export const getEmptyUserSurvivorPicksSync = Meteor.wrapAsync(getEmptyUserSurvivorPicks.call, getEmptyUserSurvivorPicks);

export const getEmptyUserTiebreakers = new ValidatedMethod({
	name: 'Game.getEmptyUserTiebreakers',
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
			removeAllTiebreakersForUserSync({ league, user_id });
			tiebreakers.forEach(tiebreaker => {
				addTiebreakerSync({ tiebreaker });
			});
		});
	}
});
export const getEmptyUserTiebreakersSync = Meteor.wrapAsync(getEmptyUserTiebreakers.call, getEmptyUserTiebreakers);

export const initSchedule = new ValidatedMethod({
	name: 'Game.insert',
	validate: new SimpleSchema({}).validator(),
	run () {
		if (Meteor.isServer) API.populateGames();
	}
});
export const initScheduleSync = Meteor.wrapAsync(initSchedule.call, initSchedule);

export const refreshGames = new ValidatedMethod({
	name: 'Game.refreshGameData',
	validate: new SimpleSchema({}).validator(),
	run () {
		const gamesInProgress = Game.find({ game: { $ne: 0 }, status: { $ne: 'C' }, kickoff: { $lte: new Date() }}).count();
		if (gamesInProgress === 0) throw new Meteor.Error('No games found', 'There are no games currently in progress');
		if (Meteor.isServer) return API.refreshGameData();
	}
});
export const refreshGamesSync = Meteor.wrapAsync(refreshGames.call, refreshGames);
