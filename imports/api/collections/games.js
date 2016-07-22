'use strict';

import { Meteor } from 'meteor/meteor';

import { Game, Games, Team } from '../schema';
import { convertEpoch } from '../global';

export const initSchedule = new ValidatedMethod({
  name: 'Game.insert',
  validate: null,
  run() {
    if (Meteor.isServer) {
      const currYear = new Date().getFullYear(),
          weeks = 17,
          data = { TYPE: 'nflSchedule', JSON: 1 },
          url = `http://www03.myfantasyleague.com/${currYear}/export`;
      let response, games, game, bonus, hTeamData, vTeamData, hTeam, vTeam;
      for (let w = 1; w <= weeks; w++) {
        data.W = w;
        response = HTTP.get(url, { params: data });
        games = response.data.nflSchedule.matchup;
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
    }
  }
});

export const currentWeek = new ValidatedMethod({
  name: 'Game.getCurrentWeek',
  validate: null,
  run() {
    const MIN_WEEK = 1,
        MAX_WEEK = 17;
    let currTime = Math.round(new Date().getTime() / 1000),
        nextGame, currWeek, startOfNextWeek;
    nextGame = Game.find({ status: { $ne: 'C' }, game: { $ne: 0 }}, { sort: { kickoff: 1 }}).fetch()[0];
    if (!nextGame) {
      currWeek = MAX_WEEK;
    } else if (nextGame.game === 1) {
      startOfNextWeek = Math.round(nextGame.kickoff.getTime() / 1000) - (24 * 3600);
      currWeek = currTime >= startOfNextWeek ? nextGame.week : nextGame.week - 1;
    } else {
      currWeek = nextGame.week;
    }
    if (currWeek < MIN_WEEK) return MIN_WEEK;
    if (currWeek > MAX_WEEK) return MAX_WEEK;
    return currWeek;
  }
});