'use strict';

import { Game } from '../../imports/api/schema';

Meteor.publish('nextGame', function() {
  return Game.find({ status: { $ne: 'C' }, game: { $ne: 0 }}, {
    fields: {
      '_id': 1,
      'week': 1,
      'game': 1,
      'status': 1,
      'kickoff': 1
    }
  });
});

Meteor.publish('gamesForWeek', function(week) {
  if (!this.userId) return null;
  return Game.find({ week, game: { $ne: 0 }}, {
    fields: {
      '_id': 1,
      'game': 1,
      'home_id': 1,
      'home_short': 1,
      'visitor_id': 1,
      'visitor_short': 1,
      'status': 1,
      'kickoff': 1
    }
  });
});

Meteor.publish('allGames', function() {
  if (!this.userId) return null;
  return Game.find({}, {
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
});
