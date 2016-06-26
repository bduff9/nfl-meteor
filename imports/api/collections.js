import { Meteor } from 'meteor/meteor';
import { Class } from 'meteor/jagi:astronomy';

export const Teams = new Mongo.Collection('teams');
export const Team = Class.create({
  name: 'Team',
  collection: Teams,
  fields: {
      city: {
          type: String
      }
  }
});

export const Games = new Mongo.Collection('games');
export const Game = Class.create({
  name: 'Game',
  collection: Games,
  fields: {
      week: {
          type: Number
      }
  }
});

export const User = Class.create({
  name: 'User',
  collection: Meteor.users,
  fields: {
      email: {
          type: String,
          validators: [{ type: 'email' }]
      }
  },
  indexes: {
    email: {
      fields: {
        email: 1
      },
      options: {
        unique: true
      }
    }
  }
});

export const NFLLogs = new Mongo.Collection('nfl-logs');
export const NFLLog = Class.create({
  name: 'NFLLog',
  collection: NFLLogs,
  fields: {
      action: {
          type: String
      }
  }
});
