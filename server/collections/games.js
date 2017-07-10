/* globals API */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Game } from '../../imports/api/collections/games';

/**
 * All server side game logic
 */

export const initSchedule = new ValidatedMethod({
	name: 'Game.insert',
	validate: new SimpleSchema({}).validator(),
	run() {
		if (Meteor.isServer) API.populateGames();
	}
});
export const initScheduleSync = Meteor.wrapAsync(initSchedule.call, initSchedule);

export const refreshGames = new ValidatedMethod({
	name: 'Game.refreshGameData',
	validate: new SimpleSchema({}).validator(),
	run() {
		const gamesInProgress = Game.find({ game: { $ne: 0 }, status: { $ne: 'C' }, kickoff: { $lte: new Date() }}).count();
		if (gamesInProgress === 0) throw new Meteor.Error('No games found', 'There are no games currently in progress');
		if (Meteor.isServer) return API.refreshGameData();
	}
});
export const refreshGamesSync = Meteor.wrapAsync(refreshGames.call, refreshGames);
