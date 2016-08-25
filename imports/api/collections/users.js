'use strict';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Game, Pick, SurvivorPick, Tiebreaker, User } from '../schema';
import { writeLog } from './nfllogs';
import { logError, overallPlacer, weekPlacer } from '../../api/global';

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

export const updateUserAdmin = new ValidatedMethod({
  name: 'User.updateAdmin',
  validate: new SimpleSchema({
    bonusPoints: { type: Number, label: 'Bonus Points', min: 1, max: 5, optional: true },
    isAdmin: { type: Boolean, label: 'Is Administrator', optional: true },
    paid: { type: Boolean, label: 'Has Paid', optional: true },
    userId: { type: String, label: 'User ID' }
  }).validator(),
  run({ bonusPoints, isAdmin, paid, userId }) {
    const myUser = User.findOne(this.userId),
        user = User.findOne(userId);
    if (!this.userId || !myUser.is_admin) throw new Meteor.Error('User.update.notLoggedIn', 'Not authorized to admin functions');
    if (isAdmin != null) user.is_admin = isAdmin;
    if (bonusPoints != null) user.bonus_points += bonusPoints;
    if (paid != null) user.paid = paid;
    user.save();
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
  validate: new SimpleSchema({
    userId: { type: String, label: 'User ID' }
  }).validator(),
  run({ userId }) {
    if (!userId) throw new Meteor.Error('User.selected_week.delete.notLoggedIn', 'Must be logged in to change week');
    if (Meteor.isServer) {
      User.update(userId, { $set: { selected_week: {}}});
    }
  }
});

export const setPick = new ValidatedMethod({
  name: 'User.picks.add',
  validate: new SimpleSchema({
    selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
    fromData: { type: Object, label: 'From List' },
    "fromData.gameId": { type: String, label: 'From Game ID', optional: true },
    "fromData.teamId": { type: String, label: 'From Team ID', optional: true },
    "fromData.teamShort": { type: String, label: 'From Team Name', optional: true },
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
    lastScore: { type: Number, label: 'Last Score', min: 0 }
  }).validator(),
  run({ selectedWeek, lastScore }) {
    if (!this.userId) throw new Meteor.Error('User.setTiebreaker.notLoggedIn', 'Must be logged in to update tiebreaker');
    if (Meteor.isServer) {
      if (lastScore > 0) {
        User.update({ _id: this.userId, "tiebreakers.week": selectedWeek }, { $set: { "tiebreakers.$.last_score": lastScore }});
      } else {
        User.update({ _id: this.userId, "tiebreakers.week": selectedWeek }, { $unset: { "tiebreakers.$.last_score": 1 }});
      }
    }
  }
});

export const resetPicks = new ValidatedMethod({
  name: 'User.resetPicks',
  validate: new SimpleSchema({
    selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 }
  }).validator(),
  run({ selectedWeek }) {
    if (!this.userId) throw new Meteor.Error('User.resetPicks.notLoggedIn', 'Must be logged in to reset picks');
    if (Meteor.isServer) {
      const user = User.findOne(this.userId),
          picks = user.picks,
          tiebreaker = user.tiebreakers[selectedWeek - 1];
      picks.forEach(pick => {
        if (pick.week === selectedWeek && !pick.hasStarted() && pick.game !== 0) {
          pick.pick_id = undefined;
          pick.pick_short = undefined;
          pick.points = undefined;
        }
      });
      tiebreaker.last_score = undefined;
      user.save();
    }
  }
});

export const autoPick = new ValidatedMethod({
  name: 'User.autoPick',
  validate: new SimpleSchema({
    available: { type: [Number], label: 'Available Points', minCount: 1, maxCount: 16 },
    selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
    type: { type: String, label: 'Auto Pick Type', allowedValues: ['home', 'away', 'random'] }
  }).validator(),
  run({ available, selectedWeek, type }) {
    if (!this.userId) throw new Meteor.Error('User.autoPick.notLoggedIn', 'Must be logged in to update picks');
    if (Meteor.isServer) {
      const user = User.findOne(this.userId),
          picks = user.picks,
          pointsLeft = Object.assign([], available);
      let game, randomTeam, teamId, teamShort, pointIndex, point;
      picks.forEach(pick => {
        if (pick.week === selectedWeek && pick.game !== 0 && !pick.hasStarted() && !pick.pick_id) {
          game = Game.findOne(pick.game_id);
          randomTeam = Math.random();
          if (type === 'home' || (type === 'random' && randomTeam < 0.5)) {
            teamId = game.home_id;
            teamShort = game.home_short;
          } else if (type === 'away' || type === 'random') {
            teamId = game.visitor_id;
            teamShort = game.visitor_short;
          }
          pointIndex = Math.floor(Math.random() * pointsLeft.length);
          point = pointsLeft.splice(pointIndex, 1);
          pick.pick_id = teamId;
          pick.pick_short = teamShort;
          pick.points = point[0];
        }
      });
      user.save();
    }
  }
});

export const submitPicks = new ValidatedMethod({
  name: 'User.submitPicks',
  validate: new SimpleSchema({
    selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 }
  }).validator(),
  run({ selectedWeek }) {
    if (!this.userId) throw new Meteor.Error('User.submitPicks.notLoggedIn', 'Must be logged in to submit picks');
    const user = User.findOne(this.userId),
        picks = user.picks,
        tiebreaker = user.tiebreakers[selectedWeek - 1];
    let noPicks = picks.filter(pick => pick.week === selectedWeek && pick.game !== 0 && !pick.hasStarted() && !pick.pick_id && !pick.pick_short && !pick.points);
    if (noPicks.length > 0) throw new Meteor.Error('User.submitPicks.missingPicks', 'You must complete all picks for the week before submitting');
    if (!tiebreaker.last_score) throw new Meteor.Error('User.submitPicks.noTiebreakerScore', 'You must submit a tiebreaker score for the last game of the week');
    if (Meteor.isServer) {
      tiebreaker.submitted = true;
      user.save();
      sendAllPicksInEmail.call({ selectedWeek }, logError);
    }
    writeLog.call({ action: 'SUBMIT_PICKS', message: `${user.first_name} ${user.last_name} has just submitted their week ${selectedWeek} picks`, userId: this.userId }, logError);
  }
});

export const sendAllPicksInEmail = new ValidatedMethod({
  name: 'User.sendAllPicksInEmail',
  validate: new SimpleSchema({
    selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 }
  }).validator(),
  run({ selectedWeek }) {
    const users = User.find().fetch(),
        notSubmitted = users.filter(user => {
          let tiebreaker = user.tiebreakers.filter(tb => tb.week === selectedWeek)[0];
          return !tiebreaker.submitted;
        });
    if (Meteor.isServer && notSubmitted.length === 0) {
      console.log(`All picks have been submitted for week ${selectedWeek}, sending emails...`);
//TODO send emails out with all picks inside
      console.log('All emails sent!');
    }
  }
});

export const assignPointsToMissed = new ValidatedMethod({
  name: 'User.picks.assignPointsToMissed',
  validate: new SimpleSchema({
    gameCount: { type: Number, label: 'Number of Games', min: 13, max: 16 },
    gameId: { type: String, label: 'Game ID' },
    week: { type: Number, label: 'Week', min: 1, max: 17 }
  }).validator(),
  run({ gameCount, gameId, week }) {
    if (Meteor.isServer) {
      const allUsers = User.find({ "done_registering": true, "picks.game_id": gameId }, { fields: {
        "_id": 1,
        "picks.$": 1
      }}).fetch();
      let missedUsers = allUsers.filter(user => !user.picks[0].points).map(user => user._id),
          users = User.find({ _id: { $in: missedUsers }}).fetch(),
          pointsUsed, maxPointVal;
      if (users.length) console.log(`${users.length} users missed game ${gameId} in week ${week}`);
      users.forEach(user => {
        maxPointVal = gameCount;
        pointsUsed = user.picks.filter(pick => pick.week === week).map(pick => pick.points);
        while (pointsUsed.indexOf(maxPointVal) > -1) maxPointVal--;
        User.update({ _id: user._id, "picks.game_id": gameId }, { $set: { "picks.$.points": maxPointVal }});
        console.log(`Auto assign ${maxPointVal} points to user ${user._id}`);
      });
    }
  }
});

export const setSurvivorPick = new ValidatedMethod({
  name: 'User.survivor.setPick',
  validate: new SimpleSchema({
    gameId: { type: String, label: 'Game ID' },
    teamId: { type: String, label: 'Team ID' },
    teamShort: { type: String, label: 'Team Name' },
    week: { type: Number, label: 'Week', min: 1, max: 17 }
  }).validator(),
  run({ gameId, teamId, teamShort, week }) {
    if (!this.userId) throw new Meteor.Error('User.survivor.setPick.notLoggedIn', 'Must be logged in to update survivor pool');
    const user = User.findOne(this.userId),
        survivorPicks = user.survivor,
        pick = survivorPicks[week - 1],
        usedIndex = survivorPicks.findIndex(pick => pick.pick_id === teamId);
    if (pick.hasStarted()) throw new Meteor.Error('User.survivor.setPick.gameAlreadyStarted', 'Cannot set survivor pick of a game that has already begun');
    if (usedIndex > -1) throw new Meteor.Error('User.survivor.setPick.alreadyUsedTeam', 'Cannot use a single team more than once in a survivor pool');
    if (Meteor.isServer) {
      User.update({ _id: this.userId, "survivor.week": week }, { $set: { "survivor.$.game_id": gameId, "survivor.$.pick_id": teamId, "survivor.$.pick_short": teamShort }});
    }
    writeLog.call({ action: 'SURVIVOR_PICK', message: `${user.first_name} ${user.last_name} just picked ${teamShort} for week ${week}`, userId: this.userId }, logError);
  }
});

export const updatePoints = new ValidatedMethod({
  name: 'User.updatePoints',
  validate: null,
  run() {
    const allUsers = User.find({ "done_registering": true });
    let picks, tiebreakers, games, points, weekGames, weekPoints;
    allUsers.forEach(user => {
      picks = user.picks;
      tiebreakers = user.tiebreakers;
      games = 0;
      points = 0;
      weekGames = new Array(18).fill(0);
      weekPoints = new Array(18).fill(0);
      picks.forEach(pick => {
        if (pick.winner_id && pick.pick_id === pick.winner_id) {
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
    const allUsers = User.find({ "done_registering": true }).fetch();
    let survivorPicks, alive;
    allUsers.forEach(user => {
      survivorPicks = user.survivor;
      alive = survivorPicks.length === 17;
      if (!alive) return true;
      survivorPicks.every((pick, i) => {
        if (!pick.pick_id && pick.week <= week) alive = false;
        if (pick.winner_id && pick.pick_id !== pick.winner_id) alive = false;
        if (!alive) {
          pick.winner_id = 'MISSED';
          survivorPicks.length = (i + 1);
          return false;
        }
      });
      user.save();
    });
  }
});

export const updatePlaces = new ValidatedMethod({
  name: 'User.tiebreakers.updatePlaces',
  validate: new SimpleSchema({
    week: { type: Number, label: 'Week' }
  }).validator(),
  run({ week }) {
    let ordUsers = User.find({ "done_registering": true }).fetch().sort(weekPlacer.bind(null, week));
    ordUsers.forEach((user, i, allUsers) => {
      const tiebreaker = user.tiebreakers[week - 1];
      let nextUser, result, nextTiebreaker;
      if (!tiebreaker.tied_flag || i === 0) {
        tiebreaker.place_in_week = (i + 1);
      }
      nextUser = allUsers[i + 1];
      if (nextUser) {
        result = weekPlacer(week, user, nextUser);
        nextTiebreaker = nextUser.tiebreakers[week - 1];
        if (result === 0) {
          tiebreaker.tied_flag = true;
          nextTiebreaker.place_in_week = (i + 1);
          nextTiebreaker.tied_flag = true;
        } else {
          tiebreaker.tied_flag = false;
          nextTiebreaker.tied_flag = false;
        }
        nextUser.save();
      }
      user.save();
    });
    ordUsers = ordUsers.sort(overallPlacer);
    ordUsers.forEach((user, i, allUsers) => {
      let nextUser, result;
      if (!user.overall_tied_flag || i === 0) {
        user.overall_place = (i + 1);
      }
      nextUser = allUsers[i + 1];
      if (nextUser) {
        result = overallPlacer(user, nextUser);
        if (result === 0) {
          user.overall_tied_flag = true;
          nextUser.overall_place = (i + 1);
          nextUser.overall_tied_flag = true;
        } else {
          user.overall_tied_flag = false;
          nextUser.overall_tied_flag = false;
        }
        nextUser.save();
      }
      user.save();
    });
  }
});
