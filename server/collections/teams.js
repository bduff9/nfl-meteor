/* global Assets */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import { Team } from '../../imports/api/collections/teams';

/**
 * Server only code for the teams collection
 */

export const initTeams = new ValidatedMethod({
	name: 'Team.insert',
	validate: null,
	run() {
		if (Meteor.isServer) {
			const data = Assets.getText('teams.json'),
					teams = JSON.parse(data);
			teams.forEach(teamObj => {
				let team = new Team(teamObj);
				team.save();
				console.log('Team Inserted: ', team);
			});
		}
	}
});
