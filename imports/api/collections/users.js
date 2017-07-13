/* jshint -W079 */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { moment } from 'meteor/momentjs:moment';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Email } from 'meteor/email';
import { Class } from 'meteor/jagi:astronomy';

import { dbVersion, DEFAULT_LEAGUE } from '../constants';
import { displayError, logError, overallPlacer, weekPlacer } from '../global';
import { gameHasStarted, getGameByID } from '../collections/games';
import { Pick } from '../collections/picks';
import { SurvivorPick } from '../collections/survivorpicks';
import { Tiebreaker } from '../collections/tiebreakers';
import { writeLog } from './nfllogs';

export const assignPointsToMissed = new ValidatedMethod({
	name: 'Users.picks.assignPointsToMissed',
	validate: new SimpleSchema({
		gameCount: { type: Number, label: 'Number of Games', min: 13, max: 16 },
		gameId: { type: String, label: 'Game ID' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ gameCount, gameId, week }) {
		if (Meteor.isServer) {
			const allUsers = User.find({ 'done_registering': true, 'picks.game_id': gameId }, { fields: {
				'_id': 1,
				'picks.$': 1
			}}).fetch();
			let missedUsers = allUsers.filter(user => !user.picks[0].points).map(user => user._id),
					users = User.find({ _id: { $in: missedUsers }}).fetch(),
					pointsUsed, maxPointVal;
			if (users.length) console.log(`${users.length} users missed game ${gameId} in week ${week}`);
			users.forEach(user => {
				maxPointVal = gameCount;
				pointsUsed = user.picks.filter(pick => pick.week === week).map(pick => pick.points);
				while (pointsUsed.indexOf(maxPointVal) > -1) maxPointVal--;
				User.update({ _id: user._id, 'picks.game_id': gameId }, { $set: { 'picks.$.points': maxPointVal }});
				console.log(`Auto assign ${maxPointVal} points to user ${user._id}`);
			});
		}
	}
});
export const assignPointsToMissedSync = Meteor.wrapAsync(assignPointsToMissed.call, assignPointsToMissed);

export const autoPick = new ValidatedMethod({
	name: 'Users.autoPick',
	validate: new SimpleSchema({
		available: { type: [Number], label: 'Available Points', minCount: 1, maxCount: 16 },
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
		type: { type: String, label: 'Auto Pick Type', allowedValues: ['home', 'away', 'random'] }
	}).validator(),
	run ({ available, selectedWeek, type }) {
		if (!this.userId) throw new Meteor.Error('Users.autoPick.notLoggedIn', 'Must be logged in to update picks');
		if (Meteor.isServer) {
			const user = User.findOne(this.userId),
					picks = user.picks,
					pointsLeft = Object.assign([], available);
			let game, randomTeam, teamId, teamShort, pointIndex, point;
			picks.forEach(pick => {
				if (pick.week === selectedWeek && pick.game !== 0 && !pick.hasStarted() && !pick.pick_id) {
					game = getGameByID.call({ id: pick.game_id }, displayError);
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
export const autoPickSync = Meteor.wrapAsync(autoPick.call, autoPick);

export const deleteUser = new ValidatedMethod({
	name: 'Users.deleteUser',
	validate: new SimpleSchema({
		userId: { type: String, label: 'User ID' }
	}).validator(),
	run ({ userId }) {
		const myUser = User.findOne(this.userId),
				user = User.findOne(userId);
		if (!this.userId || !myUser.is_admin || user.done_registering) throw new Meteor.Error('Users.deleteUser.notAuthorized', 'Not authorized to this function');
		user.remove();
	}
});
export const deleteUserSync = Meteor.wrapAsync(deleteUser.call, deleteUser);

export const getAdminUsers = new ValidatedMethod({
	name: 'Users.getAdminUsers',
	validate: new SimpleSchema({}).validator(),
	run () {
		const users = User.find({}, { sort: { last_name: 1, first_name: 1 }}).fetch();
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		return users;
	}
});
export const getAdminUsersSync = Meteor.wrapAsync(getAdminUsers.call, getAdminUsers);

export const getCurrentUser = new ValidatedMethod({
	name: 'Users.getCurrentUser',
	validate: new SimpleSchema({}).validator(),
	run () {
		const user_id = this.userId,
				currentUser = User.findOne(user_id);
		if (!user_id || !currentUser) throw new Meteor.Error('You are not signed in');
		return currentUser;
	}
});
export const getCurrentUserSync = Meteor.wrapAsync(getCurrentUser.call, getCurrentUser);

export const getSurvivorUsers = new ValidatedMethod({
	name: 'Users.getSurvivorUsers',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' }
	}).validator(),
	run ({ league }) {
		const users = User.find({ league }, { sort: { first_name: 1 }}).fetch();
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		return users;
	}
});
export const getSurvivorUsersSync = Meteor.wrapAsync(getSurvivorUsers.call, getSurvivorUsers);

export const getUserByID = new ValidatedMethod({
	name: 'Users.getUserByID',
	validate: new SimpleSchema({
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ user_id }) {
		const user = User.findOne(user_id);
		if (!user) throw new Meteor.Error('No user found!');
		return user;
	}
});
export const getUserByIDSync = Meteor.wrapAsync(getUserByID.call, getUserByID);

export const getUserName = new ValidatedMethod({
	name: 'Users.getUserName',
	validate: new SimpleSchema({
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ user_id }) {
		const user = User.findOne(user_id);
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		if (!user) throw new Meteor.Error('No user found');
		return `${user.first_name} ${user.last_name}`;
	}
});
export const getUserNameSync = Meteor.wrapAsync(getUserName.call, getUserName);

export const getUsers = new ValidatedMethod({
	name: 'Users.getUsers',
	validate: new SimpleSchema({
		activeOnly: { type: Boolean, label: 'Get Active Only' },
		league: { type: String, label: 'League', optional: true }
	}).validator(),
	run ({ activeOnly, league }) {
		const filter = {};
		if (activeOnly) filter.done_registering = true;
		if (league) filter.league = league;
		const activeUsers = User.find(filter).fetch();
		if (activeUsers.length) return activeUsers;
		throw new Meteor.Error('No active users found!');
	}
});
export const getUsersSync = Meteor.wrapAsync(getUsers.call, getUsers);

export const getUsersForLogs = new ValidatedMethod({
	name: 'Users.getUsersForLogs',
	validate: new SimpleSchema({}).validator(),
	run () {
		const users = User.find({}, { sort: { first_name: 1, last_name: 1 }}).fetch();
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		return users;
	}
});
export const getUsersForLogsSync = Meteor.wrapAsync(getUsersForLogs.call, getUsersForLogs);

export const removeSelectedWeek = new ValidatedMethod({
	name: 'Users.selected_week.delete',
	validate: new SimpleSchema({
		userId: { type: String, label: 'User ID' }
	}).validator(),
	run ({ userId }) {
		if (!userId) throw new Meteor.Error('Users.selected_week.delete.notLoggedIn', 'Must be logged in to change week');
		if (Meteor.isServer) User.update(userId, { $set: { selected_week: {}}});
	}
});
export const removeSelectedWeekSync = Meteor.wrapAsync(removeSelectedWeek.call, removeSelectedWeek);

export const resetPicks = new ValidatedMethod({
	name: 'Users.resetPicks',
	validate: new SimpleSchema({
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ selectedWeek }) {
		if (!this.userId) throw new Meteor.Error('Users.resetPicks.notLoggedIn', 'Must be logged in to reset picks');
		if (Meteor.isServer) {
			const user = User.findOne(this.userId),
					picks = user.picks,
					tiebreaker = user.tiebreakers.filter(tiebreaker => tiebreaker.week === selectedWeek)[0];
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
export const resetPicksSync = Meteor.wrapAsync(resetPicks.call, resetPicks);

export const sendAllPicksInEmail = new ValidatedMethod({
	name: 'Users.sendAllPicksInEmail',
	validate: new SimpleSchema({
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ selectedWeek }) {
		const users = User.find({ done_registering: true }).fetch(),
				notSubmitted = users.filter(user => {
					let tiebreaker = user.tiebreakers.filter(tb => tb.week === selectedWeek)[0];
					return !tiebreaker.submitted;
				});
		if (Meteor.isServer && notSubmitted.length === 0) {
			console.log(`All picks have been submitted for week ${selectedWeek}, sending emails...`);
			users.forEach(user => {
				Email.send({
					to: user.email,
					from: 'Brian Duffey <bduff9@gmail.com>',
					subject: `[NFL Confidence Pool] All picks for week ${selectedWeek} have been submitted!`,
					text: `Hello ${user.first_name},

					This is just a notice that all picks have now been submitted for week ${selectedWeek}.  You can log into the pool to view everyone's picks here: http://nfl.asitewithnoname.com

					Good luck!`,
				});
			});
			console.log('All emails sent!');
		}
	}
});
export const sendAllPicksInEmailSync = Meteor.wrapAsync(sendAllPicksInEmail.call, sendAllPicksInEmail);

export const sendWelcomeEmail = new ValidatedMethod({
	name: 'Users.sendWelcomeEmail',
	validate: new SimpleSchema({
		userId: { type: String, label: 'User ID' }
	}).validator(),
	run ({ userId }) {
		const user = User.findOne(userId),
				admins = User.find({ is_admin: true }).fetch();
		//TODO: send welcome email to user with various infos
		admins.forEach(admin => {
			Email.send({
				to: admin.email,
				from: 'Brian Duffey <bduff9@gmail.com>',
				subject: '[NFL Confidence Pool] New User Registration',
				text: `Hello ${admin.first_name},

This is just a notice that a new user has registered at ${moment().format('h:mma [on] ddd, MMM Do YYYY')} with the following information:
-Name: ${user.first_name} ${user.last_name}
-Team Name: ${user.team_name}
-Email: ${user.email}
-Referred By: ${user.referred_by}

You can maintain this user here:
http://nfl.asitewithnoname.com/admin/users`,
			});
		});
	}
});
export const sendWelcomeEmailSync = Meteor.wrapAsync(sendWelcomeEmail.call, sendWelcomeEmail);

export const setPick = new ValidatedMethod({
	name: 'Users.picks.add',
	validate: new SimpleSchema({
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
		fromData: { type: Object, label: 'From List' },
		'fromData.gameId': { type: String, label: 'From Game ID', optional: true },
		'fromData.teamId': { type: String, label: 'From Team ID', optional: true },
		'fromData.teamShort': { type: String, label: 'From Team Name', optional: true },
		toData: { type: Object, label: 'To List' },
		'toData.gameId': { type: String, label: 'To Game ID', optional: true },
		'toData.teamId': { type: String, label: 'To Team ID', optional: true },
		'toData.teamShort': { type: String, label: 'To Team Name', optional: true },
		pointVal: { type: Number, label: 'Points' },
		addOnly: { type: Boolean, label: 'Add Only' },
		removeOnly: { type: Boolean, label: 'Remove Only' }
	}).validator(),
	run ({ selectedWeek, fromData, toData, pointVal, addOnly, removeOnly }) {
		let user, picks;
		if (!this.userId) throw new Meteor.Error('Users.picks.set.notLoggedIn', 'Must be logged in to update picks');
		if (fromData.gameId && gameHasStarted.call({ gameId: fromData.gameId }, displayError)) throw new Meteor.Error('Users.picks.set.gameAlreadyStarted', 'This game has already begun');
		if (toData.gameId && gameHasStarted.call({ gameId: toData.gameId }, displayError)) throw new Meteor.Error('Users.picks.set.gameAlreadyStarted', 'This game has already begun');
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
export const setPickSync = Meteor.wrapAsync(setPick.call, setPick);

export const setSurvivorPick = new ValidatedMethod({
	name: 'Users.survivor.setPick',
	validate: new SimpleSchema({
		gameId: { type: String, label: 'Game ID' },
		teamId: { type: String, label: 'Team ID' },
		teamShort: { type: String, label: 'Team Name' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ gameId, teamId, teamShort, week }) {
		if (!this.userId) throw new Meteor.Error('Users.survivor.setPick.notLoggedIn', 'Must be logged in to update survivor pool');
		const user = User.findOne(this.userId),
				survivorPicks = user.survivor,
				pick = survivorPicks[week - 1],
				usedIndex = survivorPicks.findIndex(pick => pick.pick_id === teamId);
		if (pick.hasStarted()) throw new Meteor.Error('Users.survivor.setPick.gameAlreadyStarted', 'Cannot set survivor pick of a game that has already begun');
		if (usedIndex > -1) throw new Meteor.Error('Users.survivor.setPick.alreadyUsedTeam', 'Cannot use a single team more than once in a survivor pool');
		if (Meteor.isServer) {
			User.update({ _id: this.userId, 'survivor.week': week }, { $set: { 'survivor.$.game_id': gameId, 'survivor.$.pick_id': teamId, 'survivor.$.pick_short': teamShort }});
		}
		writeLog.call({ action: 'SURVIVOR_PICK', message: `${user.first_name} ${user.last_name} just picked ${teamShort} for week ${week}`, userId: this.userId }, logError);
	}
});
export const setSurvivorPickSync = Meteor.wrapAsync(setSurvivorPick.call, setSurvivorPick);

export const setTiebreaker = new ValidatedMethod({
	name: 'Users.setTiebreaker',
	validate: new SimpleSchema({
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 },
		lastScore: { type: Number, label: 'Last Score', min: 0 }
	}).validator(),
	run ({ selectedWeek, lastScore }) {
		if (!this.userId) throw new Meteor.Error('Users.setTiebreaker.notLoggedIn', 'Must be logged in to update tiebreaker');
		if (Meteor.isServer) {
			if (lastScore > 0) {
				User.update({ _id: this.userId, 'tiebreakers.week': selectedWeek }, { $set: { 'tiebreakers.$.last_score': lastScore }});
			} else {
				User.update({ _id: this.userId, 'tiebreakers.week': selectedWeek }, { $unset: { 'tiebreakers.$.last_score': 1 }});
			}
		}
	}
});
export const setTiebreakerSync = Meteor.wrapAsync(setTiebreaker.call, setTiebreaker);

export const submitPicks = new ValidatedMethod({
	name: 'Users.submitPicks',
	validate: new SimpleSchema({
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ selectedWeek }) {
		if (!this.userId) throw new Meteor.Error('Users.submitPicks.notLoggedIn', 'Must be logged in to submit picks');
		const user = User.findOne(this.userId),
				picks = user.picks,
				tiebreaker = user.tiebreakers.filter(tiebreaker => tiebreaker.week === selectedWeek)[0];
		let noPicks = picks.filter(pick => pick.week === selectedWeek && pick.game !== 0 && !pick.hasStarted() && !pick.pick_id && !pick.pick_short && !pick.points);
		if (noPicks.length > 0) throw new Meteor.Error('Users.submitPicks.missingPicks', 'You must complete all picks for the week before submitting');
		if (!tiebreaker.last_score) throw new Meteor.Error('Users.submitPicks.noTiebreakerScore', 'You must submit a tiebreaker score for the last game of the week');
		if (Meteor.isServer) {
			tiebreaker.submitted = true;
			user.save();
			sendAllPicksInEmail.call({ selectedWeek }, logError);
		}
		writeLog.call({ action: 'SUBMIT_PICKS', message: `${user.first_name} ${user.last_name} has just submitted their week ${selectedWeek} picks`, userId: this.userId }, logError);
	}
});
export const submitPicksSync = Meteor.wrapAsync(submitPicks.call, submitPicks);

export const updatePlaces = new ValidatedMethod({
	name: 'Users.tiebreakers.updatePlaces',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' }
	}).validator(),
	run ({ week }) {
		let ordUsers = User.find({ 'done_registering': true }).fetch().sort(weekPlacer.bind(null, week));
		ordUsers.forEach((user, i, allUsers) => {
			const tiebreaker = user.tiebreakers.filter(t => t.week === week)[0];
			let currPlace = i + 1,
					nextUser, result, nextTiebreaker;
			if (!tiebreaker.tied_flag || i === 0) {
				tiebreaker.place_in_week = currPlace;
			} else {
				currPlace = tiebreaker.place_in_week;
			}
			nextUser = allUsers[i + 1];
			if (nextUser) {
				result = weekPlacer(week, user, nextUser);
				nextTiebreaker = nextUser.tiebreakers.filter(t => t.week === week)[0];
				if (result === 0) {
					tiebreaker.tied_flag = true;
					nextTiebreaker.place_in_week = currPlace;
					nextTiebreaker.tied_flag = true;
				} else {
					if (i === 0) tiebreaker.tied_flag = false;
					nextTiebreaker.tied_flag = false;
				}
			}
		});
		ordUsers = ordUsers.sort(overallPlacer);
		ordUsers.forEach((user, i, allUsers) => {
			let currPlace = i + 1,
					nextUser, result;
			if (!user.overall_tied_flag || i === 0) {
				user.overall_place = currPlace;
			} else {
				currPlace = user.overall_place;
			}
			nextUser = allUsers[i + 1];
			if (nextUser) {
				result = overallPlacer(user, nextUser);
				if (result === 0) {
					user.overall_tied_flag = true;
					nextUser.overall_place = currPlace;
					nextUser.overall_tied_flag = true;
				} else {
					if (i === 0) user.overall_tied_flag = false;
					nextUser.overall_tied_flag = false;
				}
			}
		});
		// 2016-09-13 Moved saving to end to try and prevent endless loading screen upon game updates
		ordUsers.forEach(user => user.save());
	}
});
export const updatePlacesSync = Meteor.wrapAsync(updatePlaces.call, updatePlaces);

export const updatePoints = new ValidatedMethod({
	name: 'Users.updatePoints',
	validate: new SimpleSchema({}).validator(),
	run () {
		const allUsers = User.find({ 'done_registering': true });
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
export const updatePointsSync = Meteor.wrapAsync(updatePoints.call, updatePoints);

export const updateSelectedWeek = new ValidatedMethod({
	name: 'Users.selected_week.update',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' }
	}).validator(),
	run ({ week }) {
		if (!this.userId) throw new Meteor.Error('Users.selected_week.update.notLoggedIn', 'Must be logged in to choose week');
		if (Meteor.isServer) {
			User.update(this.userId, { $set: { 'selected_week.week': week, 'selected_week.selected_on': new Date() }});
		} else if (Meteor.isClient) {
			Session.set('selectedWeek', week);
		}
	}
});
export const updateSelectedWeekSync = Meteor.wrapAsync(updateSelectedWeek.call, updateSelectedWeek);

export const updateSurvivor = new ValidatedMethod({
	name: 'Users.survivor.update',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' }
	}).validator(),
	run ({ week }) {
		const allUsers = User.find({ 'done_registering': true }).fetch();
		let wasAlive = 0,
				nowAlive = 0;
		allUsers.forEach(user => {
			let alive = user.survivor.length === 17;
			if (!alive) return;
			wasAlive++;
			user.survivor.every((pick, i) => {
				if (!pick.pick_id && pick.week <= week) pick.winner_id = 'MISSED';
				if (pick.winner_id && pick.pick_id !== pick.winner_id) alive = false;
				if (!alive) {
					user.survivor.length = pick.week;
					return false;
				}
				nowAlive++;
				return true;
			});
			user.save();
		});
		if (nowAlive === 0 && wasAlive > 0) {
			//TODO: handle end of survivor pool here with a message to everyone and insert records into pool history

		}
	}
});
export const updateSurvivorSync = Meteor.wrapAsync(updateSurvivor.call, updateSurvivor);

export const updateUser = new ValidatedMethod({
	name: 'Users.update',
	validate: new SimpleSchema({
		done_registering: { type: Boolean, allowedValues: [true] },
		first_name: { type: String, label: 'First Name' },
		last_name: { type: String, label: 'Last Name' },
		payment_account: { type: String, label: 'Payment Account' },
		payment_type: { type: String, label: 'Payment Type' },
		referred_by: { type: String, label: 'Referred By' },
		survivor: { type: Boolean, label: 'Has Survivior?' },
		team_name: { type: String, label: 'Team Name' }
	}).validator(),
	run (userObj) {
		let user, isCreate;
		if (!this.userId) throw new Meteor.Error('Users.update.notLoggedIn', 'Must be logged in to change profile');
		user = User.findOne(this.userId);
		isCreate = !user.done_registering;
		User.update(this.userId, { $set: userObj });
		if (Meteor.isServer && isCreate) sendWelcomeEmail.call({ userId: this.userId }, logError);
	}
});
export const updateUserSync = Meteor.wrapAsync(updateUser.call, updateUser);

export const updateUserAdmin = new ValidatedMethod({
	name: 'Users.updateAdmin',
	validate: new SimpleSchema({
		isAdmin: { type: Boolean, label: 'Is Administrator', optional: true },
		paid: { type: Boolean, label: 'Has Paid', optional: true },
		userId: { type: String, label: 'User ID' }
	}).validator(),
	run ({ isAdmin, paid, userId }) {
		const myUser = User.findOne(this.userId),
				user = User.findOne(userId);
		if (!this.userId || !myUser.is_admin) throw new Meteor.Error('Users.update.notLoggedIn', 'Not authorized to admin functions');
		if (isAdmin !== null) user.is_admin = isAdmin;
		if (paid !== null) {
			user.paid = paid;
			if (paid) writeLog.call({ action: 'PAID', message: `${user.first_name} ${user.last_name} has paid`, userId }, logError);
		}
		user.save();
	}
});
export const updateUserAdminSync = Meteor.wrapAsync(updateUserAdmin.call, updateUserAdmin);

/**
 * Notification, sub-schema from User
 */
let NotificationConditional = null;
if (dbVersion > 1) {
	NotificationConditional = Class.create({
		name: 'Notification',
		secured: true,
		fields: {
			type: {
				type: [String],
				validators: [{ type: 'choice', param: ['H', 'V'] }]
			},
			hours_before: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'gt', param: 0 }, { type: 'lt', param: 72 }] }]
			},
			is_quick: {
				type: Boolean,
				default: false
			}
		}
	});
}
export const Notification = NotificationConditional;

/**
 * Selected Week, sub-schema in User
 */
export const SelectedWeek = Class.create({
	name: 'SelectedWeek',
	secured: true,
	fields: {
		week: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }],
			optional: true
		},
		selected_on: {
			type: Date,
			optional: true
		}
	}
});

/**
 * User schema
 */
let UserConditional;

if (dbVersion < 2) {
	UserConditional = Class.create({
		name: 'User',
		collection: Meteor.users,
		secured: true,
		fields: {
			email: {
				type: String,
				validators: [{ type: 'email' }]
			},
			first_name: {
				type: String,
				validators: [{ type: 'minLength', param: 1 }]
			},
			last_name: {
				type: String,
				validators: [{ type: 'minLength', param: 1 }]
			},
			team_name: String,
			referred_by: {
				type: String,
				validators: [{ type: 'minLength', param: 1, message: 'Please select whether you have played before or are new' }]
			},
			verified: Boolean,
			done_registering: Boolean,
			is_admin: {
				type: Boolean,
				default: false
			},
			paid: Boolean,
			selected_week: {
				type: SelectedWeek,
				default: () => {}
			},
			total_points: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }]
			},
			total_games: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }]
			},
			overall_place: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true
			},
			overall_tied_flag: {
				type: Boolean,
				default: false
			},
			bonus_points: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }]
			},
			picks: {
				type: [Pick],
				default: () => []
			},
			tiebreakers: {
				type: [Tiebreaker],
				default: () => []
			},
			survivor: {
				type: [SurvivorPick],
				default: () => []
			}
		},
		helpers: {
			getSelectedWeek () {
				const NO_WEEK_SELECTED = null,
						setObj = this.selected_week,
						week = setObj.week,
						dt = moment(setObj.selected_on),
						dt2 = moment();
				let hrs;
				if (!setObj.selected_on) return NO_WEEK_SELECTED;
				hrs = dt2.diff(dt, 'hours', true);
				if (hrs < 24) return week;
				return NO_WEEK_SELECTED;
			}
		},
		indexes: {}
	});
} else {
	UserConditional = Class.create({
		name: 'User',
		collection: Meteor.users,
		secured: true,
		fields: {
			email: {
				type: String,
				validators: [{ type: 'email' }]
			},
			phone_number: {
				type: String,
				optional: true
			},
			notifications: {
				type: [Notification],
				default: () => []
			},
			first_name: {
				type: String,
				validators: [{ type: 'minLength', param: 1 }]
			},
			last_name: {
				type: String,
				validators: [{ type: 'minLength', param: 1 }]
			},
			team_name: String,
			referred_by: {
				type: String,
				validators: [{ type: 'minLength', param: 1, message: 'Please select whether you have played before or are new' }]
			},
			verified: Boolean,
			done_registering: Boolean,
			leagues: {
				type: [String],
				default: () => [DEFAULT_LEAGUE]
			},
			is_admin: {
				type: Boolean,
				default: false
			},
			survivor: {
				type: Boolean,
				default: false
			},
			payment_type: {
				type: String,
				validators: [{ type: 'choice', param: ['Cash', 'PayPal', 'QuickPay', 'Venmo'] }]
			},
			payment_account: {
				type: String,
				optional: true
			},
			owe: {
				type: Number,
				default: 0.00
			},
			paid: {
				type: Number,
				default: 0.00
			},
			selected_week: {
				type: SelectedWeek,
				default: () => {}
			},
			total_points: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }]
			},
			total_games: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }]
			},
			overall_place: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true
			},
			overall_tied_flag: {
				type: Boolean,
				default: false
			}
		},
		helpers: {
			getSelectedWeek () {
				const NO_WEEK_SELECTED = null,
						{ week, selected_on } = this.selected_week,
						dateSelected = moment(selected_on),
						currentDate = moment();
				let hrs;
				if (!selected_on) return NO_WEEK_SELECTED;
				hrs = currentDate.diff(dateSelected, 'hours', true);
				if (hrs < 24) return week;
				return NO_WEEK_SELECTED;
			}
		},
		indexes: {}
	});
}

export const User = UserConditional;
