import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import { Team, TTeam } from '../../imports/api/collections/teams';

declare const Assets: any;

/**
 * Server only code for the teams collection
 */

export const clearTeams = new ValidatedMethod({
	name: 'Teams.clearTeams',
	validate: new SimpleSchema({}).validator(),
	run(): void {
		Team.remove({});
	},
});
export const clearTeamsSync = Meteor.wrapAsync(clearTeams.call, clearTeams);

export const initTeams = new ValidatedMethod({
	name: 'Team.insert',
	validate: new SimpleSchema({}).validator(),
	run(): void {
		if (Meteor.isServer) {
			const data = Assets.getText('teams.json');

			if (!data) return;

			const teams: TTeam[] = JSON.parse(data);

			teams.forEach(
				(teamObj): void => {
					let team = new Team(teamObj);

					team.save();
					console.log('Team Inserted: ', teamObj.short_name);
				},
			);
		}
	},
});
export const initTeamsSync = Meteor.wrapAsync(initTeams.call, initTeams);
