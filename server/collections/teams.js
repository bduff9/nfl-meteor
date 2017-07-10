/* global Assets */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Team } from '../../imports/api/collections/teams';

/**
 * Server only code for the teams collection
 */

export const initTeams = new ValidatedMethod({
	name: 'Team.insert',
	validate: new SimpleSchema({}).validator(),
	run() {
		if (Meteor.isServer) {
			const data = Assets.getText('teams.json'),
					teams = JSON.parse(data);
			teams.forEach(teamObj => {
				let team = new Team(teamObj);
				team.save();
				console.log('Team Inserted: ', teamObj.short_name);
			});
		}
	}
});
export const initTeamsSync = Meteor.wrapAsync(initTeams.call, initTeams);
