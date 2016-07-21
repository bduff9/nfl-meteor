'use strict';

import { Meteor } from 'meteor/meteor';

import { Game, Team } from '../schema';
import { convertEpoch } from '../global';

export const initSchedule = new ValidatedMethod({
  name: 'Game.insert',
  validate: new SimpleSchema({}).validator(),
  run() {
    if (Meteor.isServer) {
      const currYear = new Date().getFullYear(),
          weeks = 17,
          data = { TYPE: 'nflSchedule', JSON: 1 },
          url = `http://www03.myfantasyleague.com/${currYear}/export`;
      let response, games, game, kickoff, timeRemaining, hTeamData, vTeamData, hTeam, vTeam;
      for (let w = 1; w <= weeks; w++) {
        data.W = w;
        response = HTTP.get(url, { params: data });
        games = response.data.nflSchedule.matchup;
        console.log('Week ' + w + ': ' + games.length + ' games');
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
