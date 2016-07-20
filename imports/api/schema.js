import { Meteor } from 'meteor/meteor';
import { Class } from 'meteor/jagi:astronomy';

export const Teams = new Mongo.Collection('teams');
export const Team = Class.create({
  name: 'Team',
  collection: Teams,
  fields: {
      city: String,
      name: String,

  }
});

export const Games = new Mongo.Collection('games');
export const Game = Class.create({
  name: 'Game',
  collection: Games,
  fields: {
      week: {
          type: Number,
          validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
      },
      game: {
        type: Number,
        validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 0 }, { type: 'lte', param: 16 }] }]
      },

  }
});

export const Pick = Class.create({
  name: 'Pick',
  fields: {
    week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
    },
    game_id: String,
    pick_id: String,
    pick_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
    },
    points: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 16 }] }]
    },
    winner_id: String,
    winner_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
    }
  }
});

export const Tiebreaker = Class.create({
  name: 'Tiebreaker',
  fields: {
    week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
    },
    last_score: {
      type: Number,
      validators: [{ type: 'gt', param: 0 }]
    },
    last_score_act: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    final_place: {
      type: Number,
      validators: [{ type: 'gt', param: 0 }]
    }
  }
});

export const SurvivorPick = Class.create({
  name: 'SurvivorPick',
  fields: {
    week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
    },
    game_id: String,
    pick_id: String,
    pick_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
    },
    winner_id: String,
    winner_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
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
    },
    first_name: {
      type: String,
      validators: [{ type: 'minLength', param: 1 }]
    },
    last_name: {
      type: String,
      validators: [{ type: 'minLength', param: 1 }]
    },
    team_name: String,
    referred_by: {
      type: String,
      validators: [{ type: 'minLength', param: 1, message: 'Please select whether you have played before or are new' }]
    },
    verified: Boolean,
    done_registering: Boolean,
    paid: Boolean,
    chat_hidden: {
      type: Date,
      optional: true
    },
    total_points: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    total_games: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    bonus_points: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    picks: {
      type: [Pick]
    },
    tiebreakers: {
      type: [Tiebreaker]
    },
    survivor: {
      type: [SurvivorPick]
    }
  },
  indexes: {}
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
