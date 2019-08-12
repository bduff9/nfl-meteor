import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Game, TGame } from '../../imports/api/collections/games';
import { TWeek } from '../../imports/api/commonTypes';

Meteor.publish('nextGame', function (): TGame | void {
	const nextGame = Game.find(
		{ status: { $ne: 'C' } },
		{
			fields: {
				_id: 1,
				week: 1,
				game: 1,
				status: 1,
				kickoff: 1,
			},
			sort: {
				kickoff: 1,
			},
			limit: 1,
		},
	);

	if (nextGame) return nextGame;

	return this.ready();
});

Meteor.publish('nextGame1', function (): TGame | void {
	const nextGame1 = Game.find(
		{ game: 1, status: 'P' },
		{
			fields: {
				_id: 1,
				week: 1,
				game: 1,
				status: 1,
				kickoff: 1,
			},
			sort: {
				kickoff: 1,
			},
			limit: 1,
		},
	);

	if (nextGame1) return nextGame1;

	return this.ready();
});

Meteor.publish('nextGameToStart', function (): TGame | void {
	const nextGame = Game.find(
		{ status: 'P' },
		{
			fields: {
				_id: 1,
				week: 1,
				game: 1,
				status: 1,
				kickoff: 1,
			},
			sort: {
				kickoff: 1,
			},
			limit: 1,
		},
	);

	if (nextGame) return nextGame;

	return this.ready();
});

Meteor.publish('gamesForWeek', function (week: TWeek): TGame[] | void {
	let gamesForWeek;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validate({ week });
	gamesForWeek = Game.find(
		{ week },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				week: 1,
				game: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_short: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_spread: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_score: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_short: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_spread: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_score: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_short: 1,
				status: 1,
				kickoff: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				time_left: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				has_possession: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				in_redzone: 1,
			},
		},
	);

	if (gamesForWeek) return gamesForWeek;

	return this.ready();
});

Meteor.publish('firstGameOfWeek', function (week: TWeek): TGame | void {
	let firstGame;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validate({ week });
	firstGame = Game.find(
		{ week, game: 1 },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				week: 1,
				game: 1,
				kickoff: 1,
			},
		},
	);

	if (firstGame) return firstGame;

	return this.ready();
});

Meteor.publish('getGame', function (gameId: string): TGame | void {
	let game;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		gameId: { type: String, label: 'Game ID' },
	}).validate({ gameId });
	game = Game.find(gameId, {
		fields: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			_id: 1,
			week: 1,
			game: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			home_id: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			home_short: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			visitor_id: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			visitor_short: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			winner_id: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			winner_short: 1,
			status: 1,
			kickoff: 1,
		},
	});

	if (game) return game;

	return this.ready();
});

Meteor.publish('allGames', function (): TGame[] | void {
	let allGames;

	if (!this.userId) return this.ready();

	allGames = Game.find(
		{},
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				week: 1,
				game: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_short: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_score: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_short: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_score: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_short: 1,
				status: 1,
				kickoff: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				time_left: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				has_possession: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				in_redzone: 1,
			},
		},
	);

	if (allGames) return allGames;

	return this.ready();
});
