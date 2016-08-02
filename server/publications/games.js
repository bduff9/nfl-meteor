'use strict';

import { Game } from '../../imports/api/schema';

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

Meteor.publish('gamesForWeek', function(week) {
  let gamesForWeek;
  if (!this.userId) return null;
  gamesForWeek = Game.find({ week, game: { $ne: 0 }}, {
    fields: {
      '_id': 1,
      'week': 1,
      'game': 1,
      'home_id': 1,
      'home_short': 1,
      'visitor_id': 1,
      'visitor_short': 1,
      'status': 1,
      'kickoff': 1
    }
  });
  if (gamesForWeek) return gamesForWeek;
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
