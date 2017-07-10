'use strict';

import { Meteor } from 'meteor/meteor';

import { User } from '../../imports/api/collections/users';

Meteor.publish('userData', function () {
	let myUser;
	if (!this.userId) return this.ready();
	myUser = User.find(this.userId, {
		fields: {
			'_id': 1,
			'services.facebook.email': 1,
			'services.google.email': 1,
			'profile': 1,
			'email': 1,
			'first_name': 1,
			'last_name': 1,
			'team_name': 1,
			'referred_by': 1,
			'verified': 1,
			'done_registering': 1,
			'is_admin': 1,
			'paid': 1,
			'selected_week': 1,
			'total_points': 1,
			'total_games': 1,
			'overall_place': 1,
			'overall_tied_flag': 1,
			'picks': 1,
			'tiebreakers': 1,
			'survivor': 1
		}
	});
	if (myUser) return myUser;
	return this.ready();
});

Meteor.publish('basicUsersInfo', function () {
	let allUsers;
	if (!this.userId) return this.ready();
	allUsers = User.find({ done_registering: true }, {
		fields: {
			'_id': 1,
			'first_name': 1,
			'last_name': 1,
			'team_name': 1,
			'done_registering': 1
		}
	});
	if (allUsers) return allUsers;
	return this.ready();
});

Meteor.publish('overallPlaces', function () {
	let overallUsers;
	if (!this.userId) return this.ready();
	overallUsers = User.find({ done_registering: true }, {
		fields: {
			'_id': 1,
			'first_name': 1,
			'last_name': 1,
			'team_name': 1,
			'done_registering': 1,
			'total_points': 1,
			'total_games': 1,
			'overall_place': 1,
			'overall_tied_flag': 1
		},
		sort: {
			'total_points': -1,
			'total_games': -1
		}
	});
	if (overallUsers) return overallUsers;
	return this.ready();
});

Meteor.publish('adminUsers', function () {
	let allUsers;
	if (!this.userId) return this.ready();
	allUsers = User.find({}, {
		fields: {
			'_id': 1,
			'email': 1,
			'first_name': 1,
			'last_name': 1,
			'team_name': 1,
			'referred_by': 1,
			'verified': 1,
			'done_registering': 1,
			'is_admin': 1,
			'paid': 1,
			'selected_week': 1,
			'total_points': 1,
			'total_games': 1,
			'overall_place': 1,
			'overall_tied_flag': 1,
			'picks': 1,
			'tiebreakers': 1,
			'survivor': 1
		},
		sort: {
			'first_name': 1,
			'last_name': 1
		}
	});
	if (allUsers) return allUsers;
	return this.ready();
});
