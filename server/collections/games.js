/* globals API */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { populateGames, refreshGameData } from '../api-calls';
import { Game, currentWeek } from '../../imports/api/collections/games';
import { addPick, getPick, removeAllPicksForUser } from './picks';
import { addSurvivorPick, removeAllSurvivorPicksForUser } from './survivorpicks';
import { addTiebreaker, getTiebreakerFromServer, removeAllTiebreakersForUser } from './tiebreakers';
import { getLowestScore } from './users';

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
		const currWeek = currentWeek.call({});
		leagues.forEach(league => {
			let lowestScoreUser = null;
			if (currWeek > 1) lowestScoreUser = getLowestScore.call({ current_user_ids: [user_id], league, week: currWeek });
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
				let pickToAdd = pick,
						lowScorePick = null;
				if (lowestScoreUser && pick.week < currWeek) {
					lowScorePick = getPick.call({ game_id: pick.game_id, league, user_id: lowestScoreUser._id });
					const { pick_id, pick_short, points, winner_id, winner_short } = lowScorePick;
					pickToAdd = Object.assign({}, pick, {
						pick_id,
						pick_short,
						points,
						winner_id,
						winner_short
					});
					if (pick.game === 1) {
						const lowestTB = getTiebreakerFromServer.call({ league, user_id: lowestScoreUser._id, week: pick.week }),
								userTB = getTiebreakerFromServer.call({ league, user_id, week: pick.week }),
								{ last_score, last_score_act, points_earned, games_correct, place_in_week } = lowestTB;
						lowestTB.tied_flag = true;
						lowestTB.save();
						userTB.last_score = last_score;
						userTB.last_score_act = last_score_act;
						userTB.points_earned = points_earned;
						userTB.games_correct = games_correct;
						userTB.place_in_week = place_in_week;
						userTB.tied_flag = true;
						userTB.submitted = true;
						userTB.save();
					}
				}
				addPick.call({ pick: pickToAdd });
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
		populateGames();
	}
});
export const initScheduleSync = Meteor.wrapAsync(initSchedule.call, initSchedule);

export const refreshGames = new ValidatedMethod({
	name: 'Games.refreshGameData',
	validate: new SimpleSchema({}).validator(),
	run () {
		const gamesInProgress = Game.find({ game: { $ne: 0 }, status: { $ne: 'C' }, kickoff: { $lte: new Date() }}).count();
		if (gamesInProgress === 0) throw new Meteor.Error('No games found', 'There are no games currently in progress');
		return refreshGameData();
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
