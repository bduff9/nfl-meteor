'use strict';

import { Meteor } from 'meteor/meteor';

import { Pick, SurvivorPick, Tiebreaker, User } from '../schema';

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
//TODO maybe update week to look to see if any games have started instead of any games being complete
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
