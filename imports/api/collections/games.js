'use strict';

import { Meteor } from 'meteor/meteor';

import { Game, Games, Team } from '../schema';
import { convertEpoch } from '../global';

export const initSchedule = new ValidatedMethod({
  name: 'Game.insert',
  validate: null,
  run() {
    if (Meteor.isServer) API.populateGames();
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

export const refreshGames = new ValidatedMethod({
  name: 'Game.refreshGameData',
  validate: null,
  run() {
    const gamesInProgress = Game.find({ game: { $ne: 0 }, status: { $ne: "C" }, kickoff: { $lte: new Date() }}).count();
    if (gamesInProgress === -1) {
      if (Meteor.isServer) {
        return 'No games in progress';
      } else {
        throw new Meteor.Error('No games found', 'There are no games currently in progress');
      }
    }
    if (Meteor.isServer) {
      API.refreshGameData();
    }
  }
})
