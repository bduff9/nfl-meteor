import { Meteor } from 'meteor/meteor';
import { Class } from 'meteor/jagi:astronomy';
import { moment } from 'meteor/momentjs:moment';

import { ACTIONS } from './constants';

export const History = Class.create({
  name: 'History',
  secured: true,
  fields: {
    week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }],
      optional: true
    },
    game_id: String,
    opponent_id: String,
    opponent_short: String,
    was_home: Boolean,
    did_win: Boolean,
    did_tie: Boolean,
    final_score: String
  },
  methods: {
    getOpponent() {
      const team = Team.findOne(this.opponent_id);
      return team;
    }
  }
});

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
    },
    history: {
      type: [History],
      default: () => []
    }
  },
  methods: {
    isInHistory(gameId) {
      const allHist = this.history,
          thisHist = allHist.filter(h => h.game_id === gameId);
      return thisHist.length > 0;
    }
  },
  indexes: {
    shortName: {
      fields: {
        short_name: 1
      },
      options: {
        unique: true
      }
    }
  }
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
    home_spread: {
      type: Number,
      optional: true
    },
    home_score: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    visitor_id: String,
    visitor_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }]
    },
    visitor_spread: {
      type: Number,
      optional: true
    },
    visitor_score: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    winner_id: {
      type: String,
      optional: true
    },
    winner_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }],
      optional: true
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
      validators: [{ type: 'choice', param: ['H', 'V'] }],
      optional: true
    },
    in_redzone: {
      type: String,
      validators: [{ type: 'choice', param: ['H', 'V'] }],
      optional: true
    }
  },
  methods: {
    getTeam(which) {
      let team;
      if (which === 'home') {
        team = Teams.findOne({ _id: this.home_id });
      } else if (which === 'visitor') {
        team = Teams.findOne({ _id: this.visitor_id });
      } else if (which === 'winner') {
        team = Teams.findOne({ _id: this.winner_id });
      } else {
        console.error('Incorrect type passed', type);
        return null;
      }
      return team;
    }
  },
  indexes: {
    gameOrder: {
      fields: {
        week: 1,
        game: 1
      },
      options: {
        unique: true
      }
    },
    games: {
      fields: {
        game: 1
      },
      options: {}
    },
    incompleteGames: {
      fields: {
        game: 1,
        status: 1
      },
      options: {}
    },
    gameFindAPI: {
      fields: {
        week: 1,
        home_short: 1,
        visitor_short: 1
      },
      options: {
        unique: true
      }
    }
  }
});

export const Notification = Class.create({
  name: 'Notification',
  secured: true,
  fields: {
    type: {
      type: [String],
      validators: [{ type: 'choice', param: ['H', 'V'] }]
    },
    hours_before: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gt', param: 0 }, { type: 'lt', param: 72 }] }]
    },
    is_quick: {
      type: Boolean,
      default: false
    }
  }
});

export const SelectedWeek = Class.create({
  name: 'SelectedWeek',
  secured: true,
  fields: {
    week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }],
      optional: true
    },
    selected_on: {
      type: Date,
      optional: true
    }
  }
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
    phone_number: {
      type: String,
      optional: true
    },
    notifications: {
      type: [Notification],
      default: () => []
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
    leagues: [String],
    is_admin: {
      type: Boolean,
      default: false
    },
    survivor: {
      type: Boolean,
      default: false
    },
    payment_type: {
      type: String,
      validators: [{ type: 'choice', param: ['PayPal', 'QuickPay', 'Venmo'] }],
      optional: true
    },
    payment_account: {
      type: String,
      optional: true
    },
    owe: {
      type: Number,
      default: 0.00
    },
    paid: {
      type: Number,
      default: 0.00
    },
    selected_week: {
      type: SelectedWeek,
      default: () => {}
    },
    total_points: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    total_games: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }]
    },
    overall_place: {
      type: Number,
      validators: [{ type: 'gt', param: 0 }],
      optional: true
    },
    overall_tied_flag: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    getSelectedWeek() {
      const NO_WEEK_SELECTED = null,
          { week, selected_on } = this.selected_week,
          dateSelected = moment(selected_on),
          currentDate = moment();
      let hrs;
      if (!setObj.selected_on) return NO_WEEK_SELECTED;
      hrs = currentDate.diff(dateSelected, 'hours', true);
      if (hrs < 24) return week;
      return NO_WEEK_SELECTED;
    }
  },
  indexes: {}
});

export const Picks = new Mongo.Collection('picks');
export const Pick = Class.create({
  name: 'Pick',
  collection: Picks,
  secured: true,
  fields: {
    user_id: String,
    league: String,
    week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
    },
    game_id: String,
    game: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 0 }, { type: 'lte', param: 16 }] }]
    },
    pick_id: {
      type: String,
      optional: true
    },
    pick_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }],
      optional: true
    },
    points: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'gte', param: 1 }, { type: 'lte', param: 16 }] }],
      optional: true
    },
    winner_id: {
      type: String,
      optional: true
    },
    winner_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }],
      optional: true
    }
  },
  methods: {
    hasStarted() {
      const game = Game.findOne(this.game_id),
          now = new Date();
      return (game.kickoff <= now);
    },
    getTeam() {
      let team;
      team = Teams.findOne({ _id: this.pick_id });
      return team;
    }
  },
  indexes: {
    onePick: {
      fields: {
        user_id: 1,
        league: 1,
        week: 1,
        game: 1
      },
      options: {
        unique: true
      }
    },
    onePick2: {
      fields: {
        user_id: 1,
        league: 1,
        game_id: 1
      },
      options: {
        unique: true
      }
    }
  }
});

export const Tiebreakers = new Mongo.Collection('tiebreakers');
export const Tiebreaker = Class.create({
  name: 'Tiebreaker',
  collection: Tiebreakers,
  secured: true,
  fields: {
    user_id: String,
    league: String,
    week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
    },
    last_score: {
      type: Number,
      validators: [{ type: 'gt', param: 0 }],
      optional: true
    },
    submitted: {
      type: Boolean,
      default: false
    },
    last_score_act: {
      type: Number,
      validators: [{ type: 'gte', param: 0 }],
      optional: true
    },
    points_earned: {
      type: Number,
      default: 0
    },
    games_correct: {
      type: Number,
      default: 0
    },
    place_in_week: {
      type: Number,
      validators: [{ type: 'gt', param: 0 }],
      optional: true
    },
    tied_flag: {
      type: Boolean,
      default: false
    }
  },
  indexes: {
    oneWeek: {
      fields: {
        user_id: 1,
        league: 1,
        week: 1
      },
      options: {
        unique: true
      }
    }
  }
});

export const SurvivorPicks = new Mongo.Collection('survivor');
export const SurvivorPick = Class.create({
  name: 'SurvivorPick',
  collection: SurvivorPicks,
  secured: true,
  fields: {
    user_id: String,
    league: String,
    week: {
      type: Number,
      validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
    },
    game_id: {
      type: String,
      optional: true
    },
    pick_id: {
      type: String,
      optional: true
    },
    pick_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }],
      optional: true
    },
    winner_id: {
      type: String,
      optional: true
    },
    winner_short: {
      type: String,
      validators: [{ type: 'length', param: 3 }],
      optional: true
    }
  },
  methods: {
    getTeam() {
      let team;
      team = Teams.findOne({ _id: this.pick_id });
      return team;
    },
    hasStarted() {
      const game = Game.findOne({ week: this.week, game: 1 }),
          now = new Date();
      return (game.kickoff <= now);
    }
  },
  indexes: {
    onePick: {
      fields: {
        user_id: 1,
        league: 1,
        week: 1
      },
      options: {
        unique: true
      }
    }
  }
});

export const NFLLogs = new Mongo.Collection('nfllogs');
export const NFLLog = Class.create({
  name: 'NFLLog',
  collection: NFLLogs,
  secured: true,
  fields: {
    action: {
      type: String,
      validators: [{ type: 'choice', param: ACTIONS }]
    },
    when: Date,
    message: {
      type: String,
      optional: true
    },
    user_id: {
      type: String,
      optional: true
    },
    is_read: {
      type: Boolean,
      default: false
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    to_id: {
      type: String,
      optional: true
    }
  },
  methods: {
    getUser() {
      const user = User.findOne(this.user_id);
      if (this.user_id) return user;
      return null;
    },
    getUserTo() {
      const user = User.findOne(this.to_id);
      if (this.to_id) return user;
      return null;
    }
  },
  indexes: {}
});

export const PoolHistorys = new Mongo.Collection('poolhistory');
export const PoolHistory = Class.create({
  name: 'PoolHistory',
  collection: PoolHistorys,
  secured: true,
  fields: {
    user_id: String,
    year: {
      type: Number,
      validators: [{ type: 'gte', param: 2016 }], // BD: First year we started storing history
    },
    league: String,
    type: {
      type: String,
      validators: [{ type: 'choice', param: ['O', 'W'] }]
    },
    place: {
      type: Number,
      validators: [{ type: 'gt', param: 0 }]
    }
  }
});

export const SystemVals = new Mongo.Collection('systemvals');
export const SystemVal = Class.create({
  name: 'SystemVal',
  collection: SystemVals,
  secured: true,
  fields: {
    year_updated: {
      type: Number,
      validators: [{ type: 'gte', param: 2017 }], // BD: First year we added this attribute
      default: new Date().getFullYear()
    },
    games_updating: {
      type: Boolean,
      default: false
    },
    // current_connections = { CONN_ID: { opened: DATE_OPENED, on_view_my_picks: false, ... }, ... }
    current_connections: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    shouldUpdateFaster() {
      return Object.keys(this.current_connections).some(connId => {
        const conn = this.current_connections[connId];
        // Do we need to check time opened too? Maybe to prevent someone leaving this open all day?
        switch (true) {
        case conn.on_view_my_picks:
        case conn.on_view_all_picks:
        case conn.scoreboard_open:
          return true;
        default:
          return false;
        }
      });
    }
  },
  indexes: {}
});
