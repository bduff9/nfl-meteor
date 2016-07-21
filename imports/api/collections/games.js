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
      let response, games, game, kickoff, timeRemaining;
      for (let w = 1; w <= weeks; w++) {
        data.W = w;
        response = HTTP.get(url, { params: data });
        games = response.data.nflSchedule.matchup;
        console.log('Week ' + w + ': ' + games.length + ' games');
        games.forEach((gameObj, i) => {
          game = new Game({

          });
          kickoff = convertEpoch(parseInt(gameObj.kickoff, 10));
          //game.save();
        });
        //TODO populate game
        //TODO populate team
        /*"UPDATE NFL.TEAMS SET RUSHOFFENSE=0" + team.getAttribute("rushOffenseRank") + ", RUSHDEFENSE=0" + team.getAttribute("rushDefenseRank")
						+ ", PASSOFFENSE=0" + team.getAttribute("passOffenseRank") + ", PASSDEFENSE=0" + team.getAttribute("passDefenseRank")
						+ ", HASPOSSESSION='" + (team.getAttribute("hasPossession") == "" ? 0 : team.getAttribute("hasPossession"))
		        + "', INREDZONE='" + (team.getAttribute("inRedZone") == "" ? 0 : team.getAttribute("inRedZone")) + "' WHERE SHORT='" + team.getAttribute("id") + "'"
        */
      }
    }
  }
});