'use strict';

import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Game } from '../../imports/api/collections/games';

Meteor.publish('nextGame', function() {
  const nextGame = Game.find({ status: { $ne: 'C' }, game: { $ne: 0 }}, {
    fields: {
      '_id': 1,
      'week': 1,
      'game': 1,
      'status': 1,
      'kickoff': 1
    },
    sort: {
      kickoff: 1
    },
    limit: 1
  });
  if (nextGame) return nextGame;
  return this.ready();
});

Meteor.publish('nextGameToStart', function() {
  const nextGame = Game.find({ status: 'P', game: { $ne: 0 }}, {
    fields: {
      '_id': 1,
      'week': 1,
      'game': 1,
      'status': 1,
      'kickoff': 1
    },
    sort: {
      kickoff: 1
    },
    limit: 1
  });
  if (nextGame) return nextGame;
  return this.ready();
});

Meteor.publish('gamesForWeek', function(week) {
  let gamesForWeek;
  if (!this.userId) return this.ready();
  new SimpleSchema({
    week: { type: Number, label: 'Week', min: 1, max: 17 }
  }).validate({ week });
  gamesForWeek = Game.find({ week, game: { $ne: 0 }}, {
    fields: {
      '_id': 1,
      'week': 1,
      'game': 1,
      'home_id': 1,
      'home_short': 1,
      'home_spread': 1,
      'home_score': 1,
      'visitor_id': 1,
      'visitor_short': 1,
      'visitor_spread': 1,
      'visitor_score': 1,
      'winner_id': 1,
      'winner_short': 1,
      'status': 1,
      'kickoff': 1,
      'time_left': 1,
      'has_possession': 1,
      'in_redzone': 1
    }
  });
  if (gamesForWeek) return gamesForWeek;
  return this.ready();
});

Meteor.publish('firstGameOfWeek', function(week) {
  let firstGame;
  if (!this.userId) return this.ready();
  new SimpleSchema({
    week: { type: Number, label: 'Week', min: 1, max: 17 }
  }).validate({ week });
  firstGame = Game.find({ week, game: 1 }, {
    fields: {
      '_id': 1,
      'week': 1,
      'game': 1,
      'kickoff': 1
    }
  });
  if (firstGame) return firstGame;
  return this.ready();
});

Meteor.publish('getGame', function(gameId) {
  let game;
  if (!this.userId) return this.ready();
  new SimpleSchema({
    gameId: { type: String, label: 'Game ID' }
  }).validate({ gameId });
  game = Game.find(gameId, {
    fields: {
      '_id': 1,
      'week': 1,
      'game': 1,
      'home_id': 1,
      'home_short': 1,
      'visitor_id': 1,
      'visitor_short': 1,
      'winner_id': 1,
      'winner_short': 1,
      'status': 1,
      'kickoff': 1
    }
  });
  if (game) return game;
  return this.ready();
});

Meteor.publish('allGames', function() {
  let allGames;
  if (!this.userId) return null;
  allGames = Game.find({}, {
    fields: {
      '_id': 1,
      'week': 1,
      'game': 1,
      'home_id': 1,
      'home_short': 1,
      'home_score': 1,
      'visitor_id': 1,
      'visitor_short': 1,
      'visitor_score': 1,
      'winner_id': 1,
      'winner_short': 1,
      'status': 1,
      'kickoff': 1,
      'time_left': 1,
      'has_possession': 1,
      'in_redzone': 1
    }
  });
  if (allGames) return allGames;
  return this.ready();
});
