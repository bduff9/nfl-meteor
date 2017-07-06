/* globals API */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import { Game } from '../../imports/api/collections/games';

/**
 * All server side game logic
 */

export const initSchedule = new ValidatedMethod({
	name: 'Game.insert',
	validate: null,
	run() {
		if (Meteor.isServer) API.populateGames();
	}
});

export const refreshGames = new ValidatedMethod({
	name: 'Game.refreshGameData',
	validate: null,
	run() {
		const gamesInProgress = Game.find({ game: { $ne: 0 }, status: { $ne: 'C' }, kickoff: { $lte: new Date() }}).count();
		if (gamesInProgress === 0) throw new Meteor.Error('No games found', 'There are no games currently in progress');
		if (Meteor.isServer) return API.refreshGameData();
	}
});
