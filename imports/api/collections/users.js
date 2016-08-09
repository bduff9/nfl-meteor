'use strict';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Game, Pick, SurvivorPick, Tiebreaker, User } from '../schema';

export const updateUser = new ValidatedMethod({
  name: 'User.update',
  validate: new SimpleSchema({
    done_registering: { type: Boolean, allowedValues: [true] },
    first_name: { type: String, label: 'First Name' },
    last_name: { type: String, label: 'Last Name' },
    referred_by: { type: String, label: 'Referred By' },
    team_name: { type: String, label: 'Team Name' }
  }).validator(),
  run(userObj) {
    if (!this.userId) throw new Meteor.Error('User.update.notLoggedIn', 'Must be logged in to change profile');
    User.update(this.userId, { $set: userObj });
  }
});

export const updateSelectedWeek = new ValidatedMethod({
  name: 'User.selected_week.update',
  validate: new SimpleSchema({
    week: { type: Number, label: 'Week' }
  }).validator(),
  run({ week }) {
    if (!this.userId) throw new Meteor.Error('User.selected_week.update.notLoggedIn', 'Must be logged in to choose week');
    if (Meteor.isServer) {
      User.update(this.userId, { $set: { selected_week: { week, selected_on: new Date() }}});
    } else if (Meteor.isClient) {
      Session.set('selectedWeek', week);
    }
  }
});

export const removeSelectedWeek = new ValidatedMethod({
  name: 'User.selected_week.delete',
  validate: null,
  run() {
    if (!this.userId) throw new Meteor.Error('User.selected_week.delete.notLoggedIn', 'Must be logged in to change week');
    if (Meteor.isServer) {
      User.update(this.userId, { $set: { selected_week: {}}});
    }
  }
});

export const setPick = new ValidatedMethod({
  name: 'User.picks.add',
  validate: new SimpleSchema({
    selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
    fromData: { type: Object, label: 'From List' },
    "fromData.gameId": { type: String, label: 'From Game ID' },
    "fromData.teamId": { type: String, label: 'From Team ID' },
    "fromData.teamShort": { type: String, label: 'From Team Name' },
    toData: { type: Object, label: 'To List' },
    "toData.gameId": { type: String, label: 'To Game ID', optional: true },
    "toData.teamId": { type: String, label: 'To Team ID', optional: true },
    "toData.teamShort": { type: String, label: 'To Team Name', optional: true },
    pointVal: { type: Number, label: 'Points' },
    addOnly: { type: Boolean, label: 'Add Only' },
    removeOnly: { type: Boolean, label: 'Remove Only' }
  }).validator(),
  run({ selectedWeek, fromData, toData, pointVal, addOnly, removeOnly }) {
    const now = new Date();
    let game, user, picks;
    if (!this.userId) throw new Meteor.Error('User.picks.set.notLoggedIn', 'Must be logged in to update picks');
    if (fromData.gameId) {
      game = Game.findOne(fromData.gameId);
      if (game.kickoff < now) throw new Meteor.Error('User.picks.set.gameAlreadyStarted', 'This game has already begun');
    }
    if (toData.gameId) {
      game = Game.findOne(toData.gameId);
      if (game.kickoff < now) throw new Meteor.Error('User.picks.set.gameAlreadyStarted', 'This game has already begun');
    }
    if (Meteor.isServer) {
      user = User.findOne(this.userId);
      picks = user.picks;
      if (!addOnly && fromData.gameId !== toData.gameId) {
        picks.forEach(pick => {
          if (pick.week === selectedWeek && pick.game_id === fromData.gameId) {
            pick.pick_id = undefined;
            pick.pick_short = undefined;
            pick.points = undefined;
          }
        });
      }
      if (!removeOnly) {
        picks.forEach(pick => {
          if (pick.week === selectedWeek && pick.game_id === toData.gameId) {
            pick.pick_id = toData.teamId;
            pick.pick_short = toData.teamShort;
            pick.points = pointVal;
          }
        });
      }
      user.save();
    }
  }
});

export const setTiebreaker = new ValidatedMethod({
  name: 'User.setTiebreaker',
  validate: new SimpleSchema({
    selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
    lastScore: { type: Number, label: 'Last Score', min: 1 }
  }).validator(),
  run({ selectedWeek, lastScore }) {
    if (!this.userId) throw new Meteor.Error('User.setTiebreaker.notLoggedIn', 'Must be logged in to update tiebreaker');
    if (Meteor.isServer) {
      User.update({ _id: this.userId, "tiebreakers.week": selectedWeek }, { $set: { "tiebreakers.$.last_score": lastScore }});
    }
  }
});

export const updatePoints = new ValidatedMethod({
  name: 'User.updatePoints',
  validate: null,
  run() {
    const allUsers = User.find();
    let picks, tiebreakers, games, points, weekGames, weekPoints;
    allUsers.forEach(user => {
      picks = user.picks;
      tiebreakers = user.tiebreakers;
      games = 0;
      points = 0;
      weekGames = [];
      weekPoints = [];
      picks.forEach(pick => {
        if (pick.pick_id === pick.winner_id) {
          games++;
          points += pick.points;
          if (!weekGames[pick.week]) weekGames[pick.week] = 0;
          weekGames[pick.week] += 1;
          if (!weekPoints[pick.week]) weekPoints[pick.week] = 0;
          weekPoints[pick.week] += pick.points;
        }
      });
      tiebreakers.forEach(week => {
        week.games_correct = weekGames[week.week];
        week.points_earned = weekPoints[week.week];
      });
      user.total_games = games;
      user.total_points = points;
      user.save();
    });
  }
});

export const updateSurvivor = new ValidatedMethod({
  name: 'User.survivor.update',
  validate: new SimpleSchema({
    week: { type: Number, label: 'Week' }
  }).validator(),
  run({ week }) {
    const allUsers = User.find().fetch();
    let survivorPicks, alive;
    allUsers.every(user => {
      survivorPicks = user.survivor;
      alive = survivorPicks.length === 17;
      if (!alive) return true;
      survivorPicks.forEach((pick, i) => {
        if (!pick.pick_id && pick.week <= week) alive = false;
        if (pick.pick_id !== pick.winner_id) alive = false;
        if (!alive) {
          survivorPicks.length = (i + 1);
          return false;
        }
      });
      user.save();
    });
  }
});

const placer = (week, user1, user2) => {
  const tie1 = user1.tiebreakers[week - 1],
      tie2 = user2.tiebreakers[week - 1],
      lastScoreDiff1 = tie1.last_score - tie1.last_score_act,
      lastScoreDiff2 = tie2.last_score - tie2.last_score_act;
  // First, sort by points
  if (tie1.points_earned > tie2.points_earned) {
    return 1;
  } else if (tie1.points_earned < tie2.points_earned) {
    return -1;
  // Then, sort by games correct
  } else if (tie1.games_correct > tie2.games_correct) {
    return 1;
  } else if (tie1.games_correct > tie2.games_correct) {
    return -1;
  // Then, sort by whomever didn't go over the last game's score
  } else if (lastScoreDiff1 > 0 && lastScoreDiff2 < 0) {
    return 1;
  } else if (lastScoreDiff1 < 0 && lastScoreDiff2 > 0) {
    return -1;
  // Next, sort by the closer to the last games score
  } else if (Math.abs(lastScoreDiff1) < Math.abs(lastScoreDiff2)) {
    return 1;
  } else if (Math.abs(lastScoreDiff1) > Math.abs(lastScoreDiff2)) {
    return -1;
  // Finally, if we get here, then they are identical
  } else {
    return 0;
  }
};

export const updatePlaces = new ValidatedMethod({
  name: 'User.tiebreakers.updatePlaces',
  validate: new SimpleSchema({
    week: { type: Number, label: 'Week' }
  }).validator(),
  run({ week }) {
    const ordUsers = User.find().fetch().sort(placer.bind(null, week));
    let nextUser, result;
    ordUsers.forEach((user, i, allUsers) => {
      if (!user.final_place) {
        user.final_place = (i + 1);
        user.save();
      }
      nextUser = allUsers[i + 1];
      if (nextUser) {
        result = placer(week, user, nextUser);
        if (result === 0) {
          nextUser.final_place = (i + 1);
          nextUser.tied_flag = true;
          nextUser.save();
        }
      }
    });
  }
});
