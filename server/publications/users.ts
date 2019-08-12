import { Meteor } from 'meteor/meteor';

import { User, TUser } from '../../imports/api/collections/users';

Meteor.publish('userData', function (): TUser | void {
	let myUser;

	if (!this.userId) return this.ready();

	myUser = User.find(this.userId, {});

	if (myUser) return myUser;

	return this.ready();
});

Meteor.publish('basicUsersInfo', function (): TUser[] | void {
	let allUsers;

	if (!this.userId) return this.ready();

	allUsers = User.find(
		// eslint-disable-next-line @typescript-eslint/camelcase
		{ done_registering: true },
		{
			fields: {
				_id: 1,
				leagues: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				first_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				team_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				done_registering: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				years_played: 1,
				survivor: 1,
			},
		},
	);

	if (allUsers) return allUsers;

	return this.ready();
});

Meteor.publish('usersForHistory', function (): TUser[] | void {
	let allUsers;

	if (!this.userId) return this.ready();

	allUsers = User.find(
		{},
		{
			fields: {
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				first_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				team_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				years_played: 1,
			},
		},
	);

	if (allUsers) return allUsers;

	return this.ready();
});

Meteor.publish('usersForRegistration', function (): TUser[] | void {
	let allUsers;

	if (!this.userId) return this.ready();

	allUsers = User.find(
		{ trusted: true },
		{
			fields: {
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				first_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_name: 1,
				trusted: 1,
			},
		},
	);

	if (allUsers) return allUsers;

	return this.ready();
});

Meteor.publish('overallPlaces', function (): TUser | void {
	let overallUsers;

	if (!this.userId) return this.ready();

	overallUsers = User.find(
		// eslint-disable-next-line @typescript-eslint/camelcase
		{ done_registering: true },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				leagues: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				first_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				team_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				done_registering: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				total_points: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				total_games: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				overall_place: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				overall_tied_flag: 1,
			},
			sort: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				total_points: -1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				total_games: -1,
			},
		},
	);

	if (overallUsers) return overallUsers;

	return this.ready();
});

Meteor.publish('adminUsers', function (): TUser | void {
	let allUsers;

	if (!this.userId) return this.ready();

	allUsers = User.find(
		{},
		{
			sort: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_name: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				first_name: 1,
			},
		},
	);

	if (allUsers) return allUsers;

	return this.ready();
});
