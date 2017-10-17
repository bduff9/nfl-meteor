/* globals _ */
/* jshint -W079 */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { moment } from 'meteor/momentjs:moment';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Class } from 'meteor/jagi:astronomy';

import { ACCOUNT_TYPES, AUTO_PICK_TYPES, dbVersion, DEFAULT_AUTO_PICK_COUNT, DEFAULT_LEAGUE, POOL_COST, SURVIVOR_COST } from '../constants';
import { handleError, overallPlacer, weekPlacer } from '../global';
import { writeLog } from './nfllogs';
import { getAllPicksForUser, Pick } from './picks';
import { getMySurvivorPicks, markUserDead, SurvivorPick } from './survivorpicks';
import { getSystemValues } from './systemvals';
import { getAllTiebreakersForUser, getAllTiebreakersForWeek, hasAllSubmitted, Tiebreaker } from './tiebreakers';

export const deleteUser = new ValidatedMethod({
	name: 'Users.deleteUser',
	validate: new SimpleSchema({
		userId: { type: String, label: 'User ID' }
	}).validator(),
	run ({ userId }) {
		const myUser = User.findOne(this.userId),
				user = User.findOne(userId);
		if (!this.userId || !myUser.is_admin || user.done_registering) throw new Meteor.Error('Users.deleteUser.notAuthorized', 'Not authorized to this function');
		if (Meteor.isServer) {
			user.remove();
			Meteor.call('Picks.removeAllPicksForUser', { user_id: user._id }, handleError);
			Meteor.call('Tiebreakers.removeAllTiebreakersForUser', { user_id: user._id }, handleError);
			Meteor.call('SurvivorPicks.removeAllSurvivorPicksForUser', { user_id: user._id }, handleError);
		}
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

export const getAllLeagues = new ValidatedMethod({
	name: 'Users.getAllLeagues',
	validate: new SimpleSchema({}).validator(),
	run () {
		const users = User.find({ done_registering: true }, { fields: { leagues: 1 }}).fetch(),
				leagues = _.chain(users).pluck('leagues').flatten().uniq().value();
		return leagues;
	}
});
export const getAllLeaguesSync = Meteor.wrapAsync(getAllLeagues.call, getAllLeagues);

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
		const users = User.find({ leagues: league, survivor: true }, { sort: { first_name: 1 }}).fetch();
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
		return User.findOne(user_id);
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
		activeOnly: { type: Boolean, label: 'Get Active Only', optional: true },
		league: { type: String, label: 'League', optional: true }
	}).validator(),
	run ({ activeOnly, league }) {
		const filter = {};
		if (activeOnly) filter.done_registering = true;
		if (league) filter.leagues = league;
		const activeUsers = User.find(filter).fetch();
		if (activeUsers.length === 0) throw new Meteor.Error('No active users found!');
		return activeUsers;
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

export const notifyAdminsOfUntrusted = new ValidatedMethod({
	name: 'Users.notifyAdminsOfUntrusted',
	validate: new SimpleSchema({
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ user_id }) {
		if (Meteor.isServer) {
			const admins = User.find({ is_admin: true }).fetch(),
					user = User.findOne(user_id);
			admins.forEach(admin => {
				Meteor.call('Email.sendEmail', { data: { admin, newUser: user, preview: 'A new user requires confirmation to be able to participate' }, subject: 'New User Requires Admin Approval', template: 'approveUser', to: admin.email }, handleError);
			});
		}
	}
});
export const notifyAdminsOfUntrustedSync = Meteor.wrapAsync(notifyAdminsOfUntrusted.call, notifyAdminsOfUntrusted);

export const removeSelectedWeek = new ValidatedMethod({
	name: 'Users.removeSelectedWeek',
	validate: new SimpleSchema({
		userId: { type: String, label: 'User ID' }
	}).validator(),
	run ({ userId }) {
		if (!userId) throw new Meteor.Error('Users.selected_week.delete.notLoggedIn', 'Must be logged in to change week');
		if (Meteor.isServer) Meteor.users.update({ _id: userId }, { $set: { selected_week: {}}});
	}
});
export const removeSelectedWeekSync = Meteor.wrapAsync(removeSelectedWeek.call, removeSelectedWeek);

export const sendAllPicksInEmail = new ValidatedMethod({
	name: 'Users.sendAllPicksInEmail',
	validate: new SimpleSchema({
		selectedWeek: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ selectedWeek }) {
		if (Meteor.isServer) {
			const leagues = getAllLeagues.call({});
			leagues.forEach(league => {
				let leagueUsers;
				if (!hasAllSubmitted.call({ league, week: selectedWeek })) return;
				console.log(`All picks have been submitted for week ${selectedWeek} in league ${league}, sending emails...`);
				leagueUsers = User.find({ done_registering: true, leagues: league }).fetch();
				leagueUsers.forEach(user => {
					Meteor.call('Email.sendEmail', { data: { preview: `This is your notice that all users in your league have now submitted their picks for week ${selectedWeek}`, user, week: selectedWeek }, subject: `All picks for week ${selectedWeek} have been submitted!`, template: 'allSubmit', to: user.email }, handleError);
				});
				console.log('All emails sent!');
			});
		}
	}
});
export const sendAllPicksInEmailSync = Meteor.wrapAsync(sendAllPicksInEmail.call, sendAllPicksInEmail);

export const sendWelcomeEmail = new ValidatedMethod({
	name: 'Users.sendWelcomeEmail',
	validate: new SimpleSchema({
		isNewPlayer: { type: Boolean, label: 'New Player?' },
		userId: { type: String, label: 'User ID' }
	}).validator(),
	run ({ isNewPlayer, userId }) {
		const user = User.findOne(userId),
				admins = User.find({ is_admin: true }).fetch(),
				systemVals = getSystemValues.call({});
		if (Meteor.isServer) {
			Meteor.call('Email.sendEmail', { data: { preview: 'This is an email sent to everyone signing up for this year\'s confidence pool', returning: !isNewPlayer, user, year: systemVals.year_updated }, subject: `Thanks for registering, ${user.first_name}!`, template: 'newUserWelcome', to: user.email }, handleError);
			admins.forEach(admin => {
				Meteor.call('Email.sendEmail', { data: { admin, newUser: user, preview: 'This is an auto generated notice that a new user has just finished registering' }, subject: 'New User Registration', template: 'newUser', to: admin.email }, handleError);
			});
		}
	}
});
export const sendWelcomeEmailSync = Meteor.wrapAsync(sendWelcomeEmail.call, sendWelcomeEmail);

export const updateNotifications = new ValidatedMethod({
	name: 'Users.updateNotifications',
	validate: new SimpleSchema({
		do_quick_pick: { type: Boolean, label: 'Quick Pick?' },
		do_reminder: { type: Boolean, label: 'Reminder?' },
		quick_pick_hours: { type: Number, label: 'When to send quick pick' },
		reminder_hours: { type: Number, label: 'When to send reminder' },
		reminder_types_email: { type: Boolean, label: 'Send reminder as email?' },
		reminder_types_text: { type: Boolean, label: 'Send reminder as text?' }
	}).validator(),
	run ({ do_quick_pick, do_reminder, quick_pick_hours, reminder_hours, reminder_types_email, reminder_types_text }) {
		const user_id = this.userId,
				currentUser = User.findOne(user_id);
		if (!user_id) throw new Meteor.Error('Users.updateNotifications.not-signed-in', 'You are not signed in');
		currentUser.notifications = [];
		if (do_reminder) {
			const type = [];
			if (reminder_types_email) type.push('email');
			if (reminder_types_text) type.push('text');
			const reminder = new Notification({
				type,
				hours_before: reminder_hours,
				is_quick: false
			});
			currentUser.notifications.push(reminder);
		}
		if (do_quick_pick) {
			const quickPick = new Notification({
				type: ['email'],
				hours_before: quick_pick_hours,
				is_quick: true
			});
			currentUser.notifications.push(quickPick);
		}
		currentUser.save();
	}
});
export const updateNotificationsSync = Meteor.wrapAsync(updateNotifications.call, updateNotifications);

export const updatePlaces = new ValidatedMethod({
	name: 'Users.tiebreakers.updatePlaces',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week' }
	}).validator(),
	run ({ league, week }) {
		let ordUsers = getAllTiebreakersForWeek.call({ league, week }).sort(weekPlacer.bind(null, week));
		ordUsers.forEach((tiebreaker, i, allTiebreakers) => {
			let currPlace = i + 1,
					nextTiebreaker, result;
			if (!tiebreaker.tied_flag || i === 0) {
				tiebreaker.place_in_week = currPlace;
			} else {
				currPlace = tiebreaker.place_in_week;
			}
			nextTiebreaker = allTiebreakers[i + 1];
			if (nextTiebreaker) {
				result = weekPlacer(week, tiebreaker, nextTiebreaker);
				if (result === 0) {
					tiebreaker.tied_flag = true;
					nextTiebreaker.place_in_week = currPlace;
					nextTiebreaker.tied_flag = true;
				} else {
					if (i === 0) tiebreaker.tied_flag = false;
					nextTiebreaker.tied_flag = false;
				}
				nextTiebreaker.save();
			}
			tiebreaker.save();
		});
		// Now, get and sort users for overall placing
		ordUsers = User.find({ done_registering: true, leagues: league }).fetch().sort(overallPlacer);
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
	validate: new SimpleSchema({
		league: { type: String, label: 'League' }
	}).validator(),
	run ({ league }) {
		const allUsers = User.find({ done_registering: true, leagues: league });
		let picks, tiebreakers, games, points, weekGames, weekPoints;
		allUsers.forEach(user => {
			picks = getAllPicksForUser.call({ league, user_id: user._id });
			tiebreakers = getAllTiebreakersForUser.call({ league, user_id: user._id });
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
				week.save();
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
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week' }
	}).validator(),
	run ({ league, week }) {
		const allUsers = User.find({ done_registering: true, leagues: league }).fetch();
		let wasAlive = 0,
				nowAlive = 0;
		allUsers.forEach(user => {
			const survivorPicks = getMySurvivorPicks.call({ league, user_id: user._id });
			let alive = survivorPicks.length === 17;
			if (!alive) return;
			wasAlive++;
			survivorPicks.every((pick, i) => {
				if (!pick.pick_id && pick.week <= week) {
					pick.winner_id = 'MISSED';
					pick.save();
				}
				if (pick.winner_id && pick.pick_id !== pick.winner_id) alive = false;
				if (!alive) {
					markUserDead.call({ league, user_id: pick.user_id, weekDead: pick.week });
					return false;
				}
				nowAlive++;
				return true;
			});
		});
		if (nowAlive === 0 && wasAlive > 0) Meteor.call('NFLLogs.endOfSurvivorMessage', { league }, handleError);
	}
});
export const updateSurvivorSync = Meteor.wrapAsync(updateSurvivor.call, updateSurvivor);

export const updateUser = new ValidatedMethod({
	name: 'Users.updateUser',
	validate: new SimpleSchema({
		auto_pick_strategy: { type: String, label: 'Auto Pick Strategy', optional: true },
		done_registering: { type: Boolean, label: 'Done Registering?', optional: true },
		first_name: { type: String, label: 'First Name' },
		last_name: { type: String, label: 'Last Name' },
		leagues: { type: [String], label: 'Leagues', optional: true },
		payment_account: { type: String, label: 'Payment Account' },
		payment_type: { type: String, label: 'Payment Type' },
		phone_number: { type: String, label: 'Phone Number' },
		referred_by: { type: String, label: 'Referred By', optional: true },
		survivor: { type: Boolean, label: 'Has Survivior?', optional: true },
		team_name: { type: String, label: 'Team Name' }
	}).validator(),
	run (userObj) {
		const systemVals = getSystemValues.call({}),
				{ year_updated } = systemVals;
		let user, isCreate, isNewPlayer;
		if (!this.userId) throw new Meteor.Error('Users.updateUser.not-logged-in', 'Must be logged in to change profile');
		user = User.findOne(this.userId);
		isNewPlayer = !user.trusted;
		isCreate = !user.done_registering;
		user = Object.assign(user, userObj);
		if (userObj.done_registering != null) user.trusted = userObj.done_registering;
		if (isCreate && userObj.done_registering) {
			user.owe = POOL_COST;
			user.auto_pick_count = DEFAULT_AUTO_PICK_COUNT;
			Meteor.call('Games.getEmptyUserTiebreakers', { user_id: user._id, leagues: user.leagues });
			Meteor.call('Games.getEmptyUserPicks', { user_id: user._id, leagues: user.leagues });
			if (user.survivor) {
				user.owe += SURVIVOR_COST;
				Meteor.call('Games.getEmptyUserSurvivorPicks', { user_id: user._id, leagues: user.leagues });
			}
			if (!user.years_played) user.years_played = [];
			user.years_played.push(year_updated);
			user.save();
			sendWelcomeEmail.call({ isNewPlayer, userId: this.userId }, handleError);
		}
		user.save();
	}
});
export const updateUserSync = Meteor.wrapAsync(updateUser.call, updateUser);

export const updateUserAdmin = new ValidatedMethod({
	name: 'Users.updateAdmin',
	validate: new SimpleSchema({
		done_registering: { type: Boolean, label: 'Done Registering?', optional: true },
		isAdmin: { type: Boolean, label: 'Is Administrator', optional: true },
		paid: { type: Number, label: 'Amount Paid', optional: true },
		survivor: { type: Boolean, label: 'Has Survivor', optional: true },
		userId: { type: String, label: 'User ID' }
	}).validator(),
	run ({ done_registering, isAdmin, paid, survivor, userId }) {
		const myUser = User.findOne(this.userId),
				user = User.findOne(userId),
				systemVals = getSystemValues.call({}),
				{ year_updated } = systemVals;
		let isNewPlayer;
		if (!this.userId || !myUser.is_admin) throw new Meteor.Error('Users.update.notLoggedIn', 'Not authorized to admin functions');
		if (done_registering != null) {
			isNewPlayer = !user.trusted;
			user.trusted = true;
			user.years_played = [year_updated];
			if (Meteor.isServer) {
				if (!user.done_registering && done_registering) {
					user.owe = POOL_COST;
					user.auto_pick_count = DEFAULT_AUTO_PICK_COUNT;
					Meteor.call('Games.getEmptyUserPicks', { user_id: user._id, leagues: user.leagues });
					Meteor.call('Games.getEmptyUserTiebreakers', { user_id: user._id, leagues: user.leagues });
					if (survivor == null && user.survivor) {
						user.owe += SURVIVOR_COST;
						Meteor.call('Games.getEmptyUserSurvivorPicks', { user_id: user._id, leagues: user.leagues });
					}
					sendWelcomeEmail.call({ isNewPlayer, userId }, handleError);
				}
			}
			user.done_registering = done_registering;
		}
		if (isAdmin != null) user.is_admin = isAdmin;
		if (paid != null) {
			user.paid = paid;
			if (paid) writeLog.call({ action: 'PAID', message: `${user.first_name} ${user.last_name} has paid`, userId }, handleError);
		}
		if (survivor != null) {
			user.survivor = survivor;
			if (Meteor.isServer) {
				if (user.done_registering) {
					if (survivor) {
						user.owe += SURVIVOR_COST;
						Meteor.call('Games.getEmptyUserSurvivorPicks', { user_id: user._id, leagues: user.leagues });
					} else {
						user.owe -= SURVIVOR_COST;
						Meteor.call('SurvivorPicks.removeAllSurvivorPicksForUser', { user_id: user._id });
					}
				}
			}
		}
		user.save();
	}
});
export const updateUserAdminSync = Meteor.wrapAsync(updateUserAdmin.call, updateUserAdmin);

export const validateReferredBy = new ValidatedMethod({
	name: 'Users.validateReferredBy',
	validate: new SimpleSchema({
		referred_by: { type: String, label: 'Referred By' },
		user_id: { type: String, label: 'User ID', optional: true }
	}).validator(),
	run ({ referred_by, user_id = this.userId }) {
		const currentUser = User.findOne(user_id),
				allUsers = User.find({ trusted: true }).fetch();
		let foundUsers;
		if (!user_id) throw new Meteor.Error('Users.validateReferredBy.not-signed-in', 'You are not signed in');
		if (currentUser.referred_by === referred_by) return true;
		foundUsers = allUsers.filter(user => {
			const { first_name, last_name } = user,
					fullName = `${first_name.trim()} ${last_name.trim()}`.toLowerCase();
			if (user._id === user_id) return false;
			if (!user.trusted) return false;
			return fullName === referred_by.trim().toLowerCase();
		});
		return foundUsers.length > 0;
	}
});
export const validateReferredBySync = Meteor.wrapAsync(validateReferredBy.call, validateReferredBy);

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
				validators: [{ type: 'every', param: [{ type: 'choice', param: ['email', 'text'] }] }]
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
			trusted: {
				type: Boolean,
				optional: true
			},
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
			services: {
				type: Object,
				optional: true
			},
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
			trusted: {
				type: Boolean,
				optional: true
			},
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
				validators: [{ type: 'choice', param: ACCOUNT_TYPES }],
				default: 'Cash'
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
			},
			auto_pick_count: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
				default: 0
			},
			auto_pick_strategy: {
				type: String,
				validators: [{ type: 'choice', param: ['', ...AUTO_PICK_TYPES] }],
				default: ''
			},
			years_played: {
				type: [Number],
				default: () => []
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
