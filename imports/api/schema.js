import { Meteor } from 'meteor/meteor';
import { Class } from 'meteor/jagi:astronomy';

export const Teams = new Mongo.Collection('teams');
export const Team = Class.create({
  name: 'Team',
  collection: Teams,
  secured: true,
  fields: {
    city: String,
    name: String,
    short_name: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
    },
    alt_short_name: {
      type: String,
      validators: [{ type: 'and', param: [{ type: 'minLength', param: 2 }, { type: 'maxLength', param: 3 }] }]
    },
    conference: {
      type: String,
      validators: [{ type: 'choice', param: ['AFC', 'NFC'] }]
    },
    division: {
      type: String,
      validators: [{ type: 'choice', param: ['East', 'North', 'South', 'West'] }]
    },
    rank: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 0 }, { type: 'lte', param: 4 }] }],
      optional: true
    },
    logo: String,
    logo_small: String,
    primary_color: {
      type: String,
      validators: [{ type: 'regexp', param: /^#(?:[0-9a-f]{3}){1,2}$/i }]
    },
    secondary_color: {
      type: String,
      validators: [{ type: 'regexp', param: /^#(?:[0-9a-f]{3}){1,2}$/i }]
    },
    rush_defense: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }] }],
      optional: true
    },
    pass_defense: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }] }],
      optional: true
    },
    rush_offense: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }] }],
      optional: true
    },
    pass_offense: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 32 }] }],
      optional: true
    },
    bye_week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }],
      optional: true
    }
  },
  indexes: {}
});

export const Games = new Mongo.Collection('games');
export const Game = Class.create({
  name: 'Game',
  collection: Games,
  secured: true,
  fields: {
    week: {
        type: Number,
        validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
    },
    game: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 0 }, { type: 'lte', param: 16 }] }]
    },
    home_id: String,
    home_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
    },
    home_score: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    vistor_id: String,
    visitor_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
    },
    visitor_score: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    winner_id: String,
    winner_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
    },
    status: {
      type: String,
      validators: [{ type: 'choice', param: ['P', 'I', '1', '2', 'H', '3', '4', 'C'] }]
    },
    kickoff: Date,
    time_left: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 0 }, { type: 'lte', param: 3600 }] }]
    },
    has_possession: {
      type: String,
      validators: [{ type: 'choice', param: ['', 'H', 'V'] }]
    },
    in_redzone: {
      type: String,
      validators: [{ type: 'choice', param: ['', 'H', 'V'] }]
    }
  },
  indexes: {}
});

export const Pick = Class.create({
  name: 'Pick',
  secured: true,
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
  },
  indexes: {}
});

export const Tiebreaker = Class.create({
  name: 'Tiebreaker',
  secured: true,
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
  },
  indexes: {}
});

export const SurvivorPick = Class.create({
  name: 'SurvivorPick',
  secured: true,
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
  },
  indexes: {}
});

export const User = Class.create({
  name: 'User',
  collection: Meteor.users,
  secured: true,
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
  secured: true,
  fields: {
    action: {
      type: String,
      validators: [{ type: 'choice', param: ['LOGIN', 'LOGOUT', 'MESSAGE', 'SAVE_PICKS'] }]
    },
    when: Date,
    message: {
      type: String,
      optional: true
    },
    user_id: String
  },
  indexes: {}
});
