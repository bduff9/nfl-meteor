'use strict';

import { Meteor } from 'meteor/meteor';

import { Team } from '../schema';

export const initTeams = new ValidatedMethod({
  name: 'Team.insert',
  validate: new SimpleSchema({}).validator(),
  run() {
    if (Meteor.isServer) {
      const url = 'http://www.barcodegames.com/Teams';
      let response = HTTP.get(url, {}),
          leagues = xml2js.parseStringSync(response.content, { explicitArray: false }),
          conferences = leagues.LeagueFormats.LeagueFormat[0].Conferences.Conference,
          conference, divisions, division, teams, team;
      conferences.forEach(confObj => {
        conference = confObj.$.Name;
        divisions = confObj.Divisions.Division;
        divisions.forEach(divObj => {
          division = divObj.$.Name;
          teams = divObj.Teams.Team;
          teams.forEach(teamObj => {
            team = new Team({
              city: teamObj.$.City.trim(),
              name: teamObj.$.Mascot.trim(),
              short_name: (teamObj.$.Abbreviation.trim() + teamObj.$.Mascot.trim().substring(0, 1)).substring(0, 3).replace('4', 'O').toUpperCase(),
              alt_short_name: teamObj.$.Abbreviation.trim().toUpperCase(),
              conference: conference.toUpperCase().trim(),
              division: division.trim(),
              rank: parseInt(teamObj.$.LastYearStandings.trim(), 10),
              logo: teamObj.$.Logo.trim(),
              logo_small: teamObj.$.LogoSmall.trim(),
              primary_color: teamObj.$.Color.trim(),
              secondary_color: teamObj.$.Color2.trim()
            });
            team.save();
            console.log('Team Inserted: ', team);
          });
        });
      });
      // Insert Tie team
      team = new Team({
        city: 'Tie',
        name: '',
        short_name: 'TIE',
        alt_short_name: 'TIE',
        conference: 'AFC',
        division: 'North',
        rank: 4,
        logo: '',
        logo_small: '',
        primary_color: '#FFF',
        secondary_color: '#FFF'
      });
      team.save();
      console.log('Team Inserted: ', team);
      // Insert bonus points team
      team = new Team({
        city: 'Bonus',
        name: 'Points',
        short_name: 'BON',
        alt_short_name: 'BON',
        conference: 'NFC',
        division: 'West',
        rank: 4,
        logo: '',
        logo_small: '',
        primary_color: '#FFF',
        secondary_color: '#FFF'
      });
      team.save();
      console.log('Team Inserted: ', team);
    }
  }
});