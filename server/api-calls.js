'use strict';

import { Game, SystemVal, Team, User } from '../imports/api/schema';
import { assignPointsToMissed, updatePlaces, updatePoints, updateSurvivor } from '../imports/api/collections/users';
import { endOfWeekMessage } from '../imports/api/collections/nfllogs';
import { convertEpoch, logError } from '../imports/api/global';

API = {
  getGamesForWeek(week) {
    const currDate = new Date(),
        currMonth = currDate.getMonth(),
        currYear = currDate.getFullYear() - (currMonth < 2 ? 1 : 0);
    let data, url, response;
    if (Meteor.settings.mode === 'development') {
      data = {};
      url = `http://localhost:3003/W/${week}`;
    } else if (Meteor.settings.mode === 'testing') {
      data = {};
      url = `http://mrcwebapps.com:3003/W/${week}`;
    } else {
      data = { TYPE: 'nflSchedule', JSON: 1, W: week };
      url = `http://www03.myfantasyleague.com/${currYear}/export`;
    }
    response = HTTP.get(url, { params: data });
    return response.data.nflSchedule.matchup;
  },
  populateGames() {
    const weeks = 17;
    let response, games, game, bonus, hTeamData, vTeamData, hTeam, vTeam;
    for (let w = 1; w <= weeks; w++) {
      games = this.getGamesForWeek(w);
      console.log('Week ' + w + ': ' + games.length + ' games');
      // Insert one bonus game per week
      bonus = Team.findOne({ short_name: 'BON' });
      game = new Game({
        week: w,
        game: 0,
        home_id: bonus._id,
        home_short: bonus.short_name,
        home_score: 0,
        visitor_id: bonus._id,
        visitor_short: bonus.short_name,
        visitor_score: 0,
        status: 'P',
        kickoff: convertEpoch(parseInt(games[0].kickoff, 10)),
        time_left: 3600
      });
      game.save();
      games.forEach((gameObj, i) => {
        gameObj.team.forEach(team => {
          if (team.isHome === '1') hTeamData = team;
          if (team.isHome === '0') vTeamData = team;
        });
        hTeam = Team.findOne({ short_name: hTeamData.id });
        vTeam = Team.findOne({ short_name: vTeamData.id });
        // Create and save this game
        game = new Game({
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
          time_left: parseInt(gameObj.gameSecondsRemaining, 10)
        });
        game.save();
        // Update home team data
        if (hTeamData.passDefenseRank) hTeam.pass_defense = hTeamData.passDefenseRank;
        if (hTeamData.passOffenseRank) hTeam.pass_offense = hTeamData.passOffenseRank;
        if (hTeamData.rushDefenseRank) hTeam.rush_defense = hTeamData.rushDefenseRank;
        if (hTeamData.rushOffenseRank) hTeam.rush_offense = hTeamData.rushOffenseRank;
        if (!hTeam.bye_week || hTeam.bye_week === w) hTeam.bye_week = w + 1;
        hTeam.save();
        // Update visiting team data
        if (vTeamData.passDefenseRank) vTeam.pass_defense = vTeamData.passDefenseRank;
        if (vTeamData.passOffenseRank) vTeam.pass_offense = vTeamData.passOffenseRank;
        if (vTeamData.rushDefenseRank) vTeam.rush_defense = vTeamData.rushDefenseRank;
        if (vTeamData.rushOffenseRank) vTeam.rush_offense = vTeamData.rushOffenseRank;
        if (!vTeam.bye_week || vTeam.bye_week === w) vTeam.bye_week = w + 1;
        vTeam.save();
      });
    }
  },
  refreshGameData() {
    const weeksToRefresh = _.uniq(Game.find({
          game: { $ne: 0 },
          status: { $ne: "C" },
          kickoff: { $lte: new Date() }
        }, {
          sort: { week: 1 }, fields: { week: 1 }
        }).map(game => game.week), true);
    let games, gameCount, completeCount, justCompleted, game, hTeamData, vTeamData, hTeam, vTeam, winner, timeLeft, status;
    if (weeksToRefresh.length > 0) SystemVal.update({}, { $set: { games_updating: true }});
    weeksToRefresh.forEach(w => {
      games = this.getGamesForWeek(w);
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
        game = Game.findOne({ week: w, home_short: hTeamData.id, visitor_short: vTeamData.id });
        if (game.status === 'C') {
          wasComplete = true;
          console.log(`Week ${w} game ${game.game} already complete, checking for updates...`);
        } else if (game.kickoff > new Date()) {
          console.log(`Week ${w} game ${game.game} hasn't begun, skipping...`);
          return true;
        }
        hTeam = Team.findOne({ short_name: hTeamData.id });
        vTeam = Team.findOne({ short_name: vTeamData.id });
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
        game.home_score = parseInt(hTeamData.score || 0, 10);
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
            winner = Team.findOne({ short_name: 'TIE' });
          }
          game.winner_id = winner._id;
          game.winner_short = winner.short_name;
        }
        game.save();
        if (status !== 'P') {
          // Game has started, assign highest available point total to missed picks
          assignPointsToMissed.call({ week: w, gameId: game._id, gameCount }, logError);
        }
        if (status === 'C') {
          completeCount++;
          if (!wasComplete) justCompleted++;
          // Update the team's history array
          // Updated 2016-09-13 to ensure history always gets filled in
          console.log(`Game ${game.game} complete, updating history...`);
          if (!hTeam.isInHistory(game._id)) {
            hTeam.history.push({ game_id: game._id, opponent_id: vTeam._id, opponent_short: vTeam.short_name, was_home: true, did_win: game.winner_short === hTeam.short_name, did_tie: game.winner_short === 'TIE', final_score: (game.home_score > game.visitor_score ? `${game.home_score}-${game.visitor_score}` : `${game.visitor_score}-${game.home_score}`) });
          }
          if (!vTeam.isInHistory(game._id)) {
            vTeam.history.push({ game_id: game._id, opponent_id: hTeam._id, opponent_short: hTeam.short_name, was_home: false, did_win: game.winner_short === vTeam.short_name, did_tie: game.winner_short === 'TIE', final_score: (game.home_score > game.visitor_score ? `${game.home_score}-${game.visitor_score}` : `${game.visitor_score}-${game.home_score}`) });
          }
          console.log(`Game ${game.game} history updated!`);
          // Update the picks for each user
          console.log(`Game ${game.game} complete, updating picks...`);
          // Changed the below to use the raw collection for performance (8 sec -> 5ms)
          Meteor.users.update({ 'done_registering': true, 'picks.game_id': game._id }, { $set: { 'picks.$.winner_id': game.winner_id, 'picks.$.winner_short': game.winner_short }}, { multi: true });
          console.log(`Game ${game.game} picks updated!`);
          // Update the survivor pool
          console.log(`Game ${game.game} complete, updating survivor...`);
          // Changed the below to the raw collection for performance
          Meteor.users.update({ 'done_registering': true, 'survivor.game_id': game._id }, { $set: { 'survivor.$.winner_id': game.winner_id, 'survivor.$.winner_short': game.winner_short }}, { multi: true });
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
        const lastGame = Game.findOne({ week: w }, { sort: { game: -1 }});
        User.update({ 'done_registering': true, 'tiebreakers.week': w }, { $set: { 'tiebreakers.$.last_score_act': (lastGame.home_score + lastGame.visitor_score) }}, { multi: true });
        console.log(`Week ${w} tiebreakers successfully updated!`);
        endOfWeekMessage.call({ week: w }, logError);
      }
      console.log(`Finished updating games for week ${w}!`);
      // Updated 2016-09-13 to improve update performance
      if (justCompleted > 0 || gameCount === completeCount) {
        console.log(`${(gameCount === completeCount ? `All games complete for week ${w}` : `${justCompleted} games newly complete for week ${w}`)}, now updating users...`);
        updatePoints.call(err => {
          if (err) console.error('updatePoints', err);
        });
        updatePlaces.call({ week: w }, err => {
          if (err) console.error('updatePlaces', err);
        });
        updateSurvivor.call({ week: w }, err => {
          if (err) console.error('updateSurvivor', err);
        });
        console.log(`Finished updating users for week ${w}!`);
      }
      console.log(`Week ${w} successfully updated!`);
    });
    SystemVal.update({}, { $set: { games_updating: false }});
    return `Successfully updated all weeks in list: ${weeksToRefresh}`;
  }
}
