/*jshint esversion: 6 */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Migrations } from 'meteor/percolate:migrations';

import { dbVersion, DEFAULT_LEAGUE } from '../imports/api/constants';
import { getCurrentSeasonYear } from '../imports/api/global';
import { removeBonusPointGamesSync } from './collections/games';
import { addPickSync, removeBonusPointPicksSync } from './collections/picks';
import { addPoolHistorySync } from '../imports/api/collections/poolhistorys';
import { addSurvivorPickSync } from './collections/survivorpicks';
import { getSystemValues, removeYearUpdatedSync } from '../imports/api/collections/systemvals';
import { addTiebreakerSync } from './collections/tiebreakers';
import { getUsersSync } from '../imports/api/collections/users';

const initialDB = function initialDB (migration) {
	// NOOP as astronomy handles this
};

const make2017Changes = function make2017Changes (migration) {
	const systemVals = getSystemValues.call({});
	const lastUpdated = systemVals.year_updated || getCurrentSeasonYear();
	let users = Meteor.users.find({});

	users.forEach(user => {
		const id = user._id;
		const { picks, referred_by, survivor, tiebreakers } = user;

		if (!referred_by.match(/\s/)) Meteor.users.update({ _id: id }, { $set: { referred_by: `${referred_by} PLAYER` }});

		picks.forEach(pick => {
			pick.user_id = id;
			pick.league = DEFAULT_LEAGUE;
			addPickSync({ pick });
		});

		survivor.forEach(surv => {
			surv.user_id = id;
			surv.league = DEFAULT_LEAGUE;
			addSurvivorPickSync({ survivorPick: surv });
		});

		tiebreakers.forEach(tb => {
			tb.user_id = id;
			tb.league = DEFAULT_LEAGUE;
			addTiebreakerSync({ tiebreaker: tb });
		});
	});

	removeBonusPointGamesSync({});
	removeBonusPointPicksSync({});

	// Get rankings by week (top 2) and overall (top 3) for insert into pool history. Should we get last place person as well?
	users = Meteor.users.find({});

	let mostSurvivorWeeks = 0;
	let survivorWinner;

	users.forEach(user => {
		const history = {
			user_id: user._id,
			year: lastUpdated,
			league: user.league || DEFAULT_LEAGUE,
			type: 'W'
		};

		if (user.survivor.length > mostSurvivorWeeks) {
			mostSurvivorWeeks = user.survivor.length;
			survivorWinner = user;
		}

		user.tiebreakers.forEach(week => {
			const place = week.place_in_week;

			if (place <= 2) {
				history.week = week.week;
				history.place = place;
				addPoolHistorySync({ poolHistory: history });
			}
		});
	});

	if (survivorWinner) {
		const poolHistory = {
			user_id: survivorWinner._id,
			year: lastUpdated,
			league: survivorWinner.league || DEFAULT_LEAGUE,
			type: 'S',
			place: 1
		};

		addPoolHistorySync({ poolHistory });
	}

	Meteor.users.update({}, { $set: { leagues: [DEFAULT_LEAGUE], owe: 30, paid: 30, survivor: true, trusted: true, years_played: [lastUpdated] }, $unset: { picks: true, tiebreakers: true }}, { multi: true });
};

const undo2017Changes = function undo2017Changes (migration) {
	const users = getUsersSync({ activeOnly: false });
	const Picks = new Mongo.Collection('picks');
	const Tiebreakers = new Mongo.Collection('tiebreakers');
	const SurvivorPicks = new Mongo.Collection('survivor');
	const PoolHistorys = new Mongo.Collection('poolhistorys');

	users.forEach(user => {
		const oldPicks = Picks.find({ user_id: user._id }, { sort: { week: 1, game: 1 }});
		const newPicks = [];
		const oldTiebreakers = Tiebreakers.find({ user_id: user._id }, { sort: { week: 1 }});
		const newTiebreakers = [];
		const oldSurvivorPicks = SurvivorPicks.find({ user_id: user._id }, { sort: { week: 1 }});
		const newSurvivorPicks = [];

		oldPicks.forEach(pick => {
			delete pick.user_id;
			delete pick.league;
			newPicks.push(pick);
		});

		user.picks = newPicks;

		oldTiebreakers.forEach(tb => {
			delete tb.user_id;
			delete tb.league;
			newTiebreakers.push(tb);
		});

		user.tiebreakers = newTiebreakers;

		oldSurvivorPicks.forEach(pick => {
			delete pick.user_id;
			delete pick.league;
			newSurvivorPicks.push(pick);
		});

		user.survivor = newSurvivorPicks;
		user.paid = true;
		delete user.phone_number;
		delete user.notifications;
		delete user.leagues;
		delete user.payment_type;
		delete user.payment_account;
		delete user.owe;
		delete user.trusted;
		delete user.years_played;
		user.save();
	});

	removeYearUpdatedSync();

	// Delete new db structures after previous so we don't lose data
	Picks.rawCollection().drop();
	Tiebreakers.rawCollection().drop();
	SurvivorPicks.rawCollection().drop();
	PoolHistorys.rawCollection().drop();
};


Migrations.add({
	version: 1,
	name: 'Initial db structure',
	up: initialDB
});

Migrations.add({
	version: 2,
	name: 'Changes for 2017 season i.e. un-embed collections and add new user values',
	up: make2017Changes,
	down: undo2017Changes
});

Meteor.startup(function () {
	Migrations.migrateTo(dbVersion);
});
