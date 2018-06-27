'use strict';

import { Meteor } from 'meteor/meteor';
import { moment } from 'meteor/momentjs:moment';
import { HTTP } from 'meteor/http';

import { WEEKS_IN_SEASON } from '../imports/api/constants';
import { convertEpoch, handleError } from '../imports/api/global';
import { currentWeek, findGame, getFirstGameOfWeek, getWeeksToRefresh, insertGame } from '../imports/api/collections/games';
import { endOfWeekMessage } from './collections/nfllogs';
import { assignPointsToMissed, Picks } from '../imports/api/collections/picks';
import { SurvivorPicks } from '../imports/api/collections/survivorpicks';
import { getSystemValues, toggleGamesUpdating } from '../imports/api/collections/systemvals';
import { getTeamByShort, getTeamByShortSync } from '../imports/api/collections/teams';
import { updateLastGameOfWeekScore } from './collections/tiebreakers';
import { getAllLeagues, updatePlaces, updatePoints, updateSurvivor } from '../imports/api/collections/users';

export const getGamesForWeek = function getGamesForWeek (week) {
	const systemVals = getSystemValues.call({});
	const currYear = systemVals.year_updated;
	const data = { TYPE: 'nflSchedule', JSON: 1, W: week };
	let url;
	let response;

	if (Meteor.settings.mode === 'production' || !Meteor.settings.apiHost) {
		url = 'http://www03.myfantasyleague.com';
	} else {
		url = Meteor.settings.apiHost;
	}

	url += `/${currYear}/export`;
	response = HTTP.get(url, { params: data });

	return response.data.nflSchedule.matchup;
};

export const populateGames = function	populateGames () {
	for (let w = 1; w <= WEEKS_IN_SEASON; w++) populateGamesForWeek(w);
};

export const populateGamesForWeek = function populateGamesForWeek (w) {
	const games = getGamesForWeek(w);
	let game;
	let hTeamData;
	let vTeamData;
	let hTeam;
	let vTeam;

	console.log('Week ' + w + ': ' + games.length + ' games');

	games.forEach((gameObj, i) => {
		gameObj.team.forEach(team => {
			if (team.isHome === '1') hTeamData = team;
			if (team.isHome === '0') vTeamData = team;
		});

		hTeam = getTeamByShortSync({ short_name: hTeamData.id });
		vTeam = getTeamByShortSync({ short_name: vTeamData.id });

		// Create and save this game
		game = {
			week: w,
			game: (i + 1),
			home_id: hTeam._id,
			home_short: hTeam.short_name,
			home_score: 0,
			visitor_id: vTeam._id,
			visitor_short: vTeam.short_name,
			visitor_score: 0,
			status: 'P',
			kickoff: convertEpoch(parseInt(gameObj.kickoff, 10)),
			time_left: parseInt(gameObj.gameSecondsRemaining, 10),
		};

		insertGame.call({ game }, handleError);
		// Update home team data
		if (hTeamData.passDefenseRank) hTeam.pass_defense = parseInt(hTeamData.passDefenseRank, 10);
		if (hTeamData.passOffenseRank) hTeam.pass_offense = parseInt(hTeamData.passOffenseRank, 10);
		if (hTeamData.rushDefenseRank) hTeam.rush_defense = parseInt(hTeamData.rushDefenseRank, 10);
		if (hTeamData.rushOffenseRank) hTeam.rush_offense = parseInt(hTeamData.rushOffenseRank, 10);
		if (!hTeam.bye_week || hTeam.bye_week === w) hTeam.bye_week = w + 1;

		hTeam.save();

		// Update visiting team data
		if (vTeamData.passDefenseRank) vTeam.pass_defense = parseInt(vTeamData.passDefenseRank, 10);
		if (vTeamData.passOffenseRank) vTeam.pass_offense = parseInt(vTeamData.passOffenseRank, 10);
		if (vTeamData.rushDefenseRank) vTeam.rush_defense = parseInt(vTeamData.rushDefenseRank, 10);
		if (vTeamData.rushOffenseRank) vTeam.rush_offense = parseInt(vTeamData.rushOffenseRank, 10);
		if (!vTeam.bye_week || vTeam.bye_week === w) vTeam.bye_week = w + 1;

		vTeam.save();
	});
};

export const updateGames = function	updateGames () {
	const week = currentWeek.call();
	const firstGameOfWeek = getFirstGameOfWeek.call({ week }, handleError);
	const weekHasStarted = moment().isSameOrAfter(firstGameOfWeek.kickoff);
	const weekToUpdate = (weekHasStarted ? week + 1 : week);
	const games = getGamesForWeek(weekToUpdate);

	console.log(`Updating game info for week ${weekToUpdate}...`);

	games.forEach(gameObj => {
		let hTeamData;
		let vTeamData;
		let game;
		let hTeam;
		let vTeam;

		gameObj.team.forEach(team => {
			if (team.isHome === '1') hTeamData = team;
			if (team.isHome === '0') vTeamData = team;
		});

		game = findGame.call({ week: weekToUpdate, home_short: hTeamData.id, visitor_short: vTeamData.id }, handleError);

		if (hTeamData.spread) game.home_spread = Math.round(parseFloat(hTeamData.spread, 10) * 10) / 10;
		if (vTeamData.spread) game.visitor_spread = Math.round(parseFloat(vTeamData.spread, 10) * 10) / 10;

		game.save();

		// Update home team data
		hTeam = getTeamByShortSync({ short_name: hTeamData.id });

		if (hTeamData.passDefenseRank) hTeam.pass_defense = parseInt(hTeamData.passDefenseRank, 10);
		if (hTeamData.passOffenseRank) hTeam.pass_offense = parseInt(hTeamData.passOffenseRank, 10);
		if (hTeamData.rushDefenseRank) hTeam.rush_defense = parseInt(hTeamData.rushDefenseRank, 10);
		if (hTeamData.rushOffenseRank) hTeam.rush_offense = parseInt(hTeamData.rushOffenseRank, 10);

		hTeam.save();

		// Update visiting team data
		vTeam = getTeamByShortSync({ short_name: vTeamData.id });

		if (vTeamData.passDefenseRank) vTeam.pass_defense = parseInt(vTeamData.passDefenseRank, 10);
		if (vTeamData.passOffenseRank) vTeam.pass_offense = parseInt(vTeamData.passOffenseRank, 10);
		if (vTeamData.rushDefenseRank) vTeam.rush_defense = parseInt(vTeamData.rushDefenseRank, 10);
		if (vTeamData.rushOffenseRank) vTeam.rush_offense = parseInt(vTeamData.rushOffenseRank, 10);

		vTeam.save();
	});

	console.log(`Game info for week ${weekToUpdate} updated!`);
};

export const refreshGameData = function refreshGameData () {
	const weeksToRefresh = getWeeksToRefresh.call({});
	let games;
	let gameCount;
	let completeCount;
	let justCompleted;
	let game;
	let hTeamData;
	let vTeamData;
	let hTeam;
	let vTeam;
	let winner;
	let timeLeft;
	let status;

	toggleGamesUpdating.call({ is_updating: weeksToRefresh.length > 0 });

	weeksToRefresh.forEach(w => {
		games = getGamesForWeek(w);
		gameCount = games.length;
		completeCount = 0;
		justCompleted = 0;

		console.log(`Updating week ${w}, ${gameCount} games found`);

		games.every((gameObj, i) => {
			let wasComplete = false;

			gameObj.team.forEach(team => {
				if (team.isHome === '1') hTeamData = team;
				if (team.isHome === '0') vTeamData = team;
			});

			game = findGame.call({ week: w, home_short: hTeamData.id, visitor_short: vTeamData.id });

			if (game.status === 'C') {
				wasComplete = true;

				console.log(`Week ${w} game ${game.game} already complete, checking for updates...`);
			} else if (game.kickoff > new Date()) {
				console.log(`Week ${w} game ${game.game} hasn't begun, skipping...`);

				return true;
			}

			hTeam = getTeamByShortSync({ short_name: hTeamData.id });
			vTeam = getTeamByShortSync({ short_name: vTeamData.id });

			// Update and save this game
			timeLeft = parseInt(gameObj.gameSecondsRemaining, 10);

			if (timeLeft >= 3600) {
				status = 'P';
			} else if (timeLeft < 3600 && timeLeft > 2700) {
				status = '1';
			} else if (timeLeft <= 2700 && timeLeft > 1800) {
				status = '2';
			} else if (timeLeft === 1800) {
				status = 'H';
			} else if (timeLeft < 1800 && timeLeft > 900) {
				status = '3';
			} else if (timeLeft <= 900 && timeLeft > 0) {
				status = '4';
			} else if (timeLeft === 0) {
				status = 'C';
			} else { // timeLeft is less than 0
				status = 'I';
			}

			if (hTeamData.spread) game.home_spread = Math.round(parseFloat(hTeamData.spread, 10) * 10) / 10;

			game.home_score = parseInt(hTeamData.score || 0, 10);

			if (vTeamData.spread) game.visitor_spread = Math.round(parseFloat(vTeamData.spread, 10) * 10) / 10;

			game.visitor_score = parseInt(vTeamData.score || 0, 10);
			game.status = status;
			game.time_left = timeLeft;
			game.has_possession = (hTeamData.hasPossession === '1' ? 'H' : (vTeamData.hasPossession === '1' ? 'V' : null));
			game.in_redzone = (hTeamData.inRedZone === '1' ? 'H' : (vTeamData.inRedZone === '1' ? 'V' : null));

			if (status === 'C') {
				if (game.home_score > game.visitor_score) {
					winner = hTeam;
				} else if (game.home_score < game.visitor_score) {
					winner = vTeam;
				} else {
					winner = getTeamByShort.call({ short_name: 'TIE' });
				}

				game.winner_id = winner._id;
				game.winner_short = winner.short_name;
			}

			game.save();

			if (status !== 'P') {
				// Game has started, assign highest available point total to missed picks
				assignPointsToMissed.call({ week: w, gameId: game._id, gameCount }, handleError);
			}

			if (status === 'C') {
				completeCount++;

				if (!wasComplete) justCompleted++;

				// Update the team's history array
				// Updated 2016-09-13 to ensure history always gets filled in
				console.log(`Game ${game.game} complete, updating history...`);

				if (!hTeam.isInHistory(game._id)) {
					hTeam.history.push({ week: w, game_id: game._id, opponent_id: vTeam._id, opponent_short: vTeam.short_name, was_home: true, did_win: game.winner_short === hTeam.short_name, did_tie: game.winner_short === 'TIE', final_score: (game.home_score > game.visitor_score ? `${game.home_score}-${game.visitor_score}` : `${game.visitor_score}-${game.home_score}`) });
				}

				if (!vTeam.isInHistory(game._id)) {
					vTeam.history.push({ week: w, game_id: game._id, opponent_id: hTeam._id, opponent_short: hTeam.short_name, was_home: false, did_win: game.winner_short === vTeam.short_name, did_tie: game.winner_short === 'TIE', final_score: (game.home_score > game.visitor_score ? `${game.home_score}-${game.visitor_score}` : `${game.visitor_score}-${game.home_score}`) });
				}

				console.log(`Game ${game.game} history updated!`);
				// Update the picks for each user
				console.log(`Game ${game.game} complete, updating picks...`);
				// Changed the below to use the raw collection for performance (8 sec -> 5ms)
				Picks.update({ game_id: game._id }, { $set: { winner_id: game.winner_id, winner_short: game.winner_short }}, { multi: true });
				console.log(`Game ${game.game} picks updated!`);
				// Update the survivor pool
				console.log(`Game ${game.game} complete, updating survivor...`);
				// Changed the below to the raw collection for performance
				SurvivorPicks.update({ game_id: game._id }, { $set: { winner_id: game.winner_id, winner_short: game.winner_short }}, { multi: true });
				console.log(`Game ${game.game} survivor updated!`);
			}

			// Update home team data
			if (hTeamData.passDefenseRank) hTeam.pass_defense = parseInt(hTeamData.passDefenseRank, 10);
			if (hTeamData.passOffenseRank) hTeam.pass_offense = parseInt(hTeamData.passOffenseRank, 10);
			if (hTeamData.rushDefenseRank) hTeam.rush_defense = parseInt(hTeamData.rushDefenseRank, 10);
			if (hTeamData.rushOffenseRank) hTeam.rush_offense = parseInt(hTeamData.rushOffenseRank, 10);

			hTeam.save();

			// Update visiting team data
			if (vTeamData.passDefenseRank) vTeam.pass_defense = parseInt(vTeamData.passDefenseRank, 10);
			if (vTeamData.passOffenseRank) vTeam.pass_offense = parseInt(vTeamData.passOffenseRank, 10);
			if (vTeamData.rushDefenseRank) vTeam.rush_defense = parseInt(vTeamData.rushDefenseRank, 10);
			if (vTeamData.rushOffenseRank) vTeam.rush_offense = parseInt(vTeamData.rushOffenseRank, 10);

			vTeam.save();

			console.log(`Week ${w} game ${game.game} successfully updated!`);

			return true;
		});

		if (gameCount === completeCount) {
			console.log(`Week ${w} complete, updating tiebreakers...`);
			updateLastGameOfWeekScore.call({ week: w });
			console.log(`Week ${w} tiebreakers successfully updated!`);
		}

		console.log(`Finished updating games for week ${w}!`);

		// Updated 2016-09-13 to improve update performance
		if (justCompleted > 0 || gameCount === completeCount) {
			console.log(`${(gameCount === completeCount ? `All games complete for week ${w}` : `${justCompleted} games newly complete for week ${w}`)}, now updating users...`);

			const leagues = getAllLeagues.call({});

			leagues.forEach(league => {
				updatePoints.call({ league });
				updatePlaces.call({ league, week: w });
				updateSurvivor.call({ league, week: w });
			});

			if (gameCount === completeCount) endOfWeekMessage.call({ week: w }, handleError);

			console.log(`Finished updating users for week ${w}!`);
		}

		console.log(`Week ${w} successfully updated!`);
	});

	toggleGamesUpdating.call({ is_updating: false });

	return `Successfully updated all weeks in list: ${weeksToRefresh}`;
};
