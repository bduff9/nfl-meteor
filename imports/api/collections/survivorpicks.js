'use strict';

import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';

import { dbVersion } from '../../api/constants';
import { Game } from './games';
import { Team } from './teams';

/**
 * All survivor logic
 * @since 2017-06-26
 */

let SurvivorPicksConditional = null;
let SurvivorPickConditional = null;

if (dbVersion < 2) {
  SurvivorPickConditional = Class.create({
    name: 'SurvivorPick',
    secured: true,
    fields: {
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
    helpers: {
      getTeam() {
        let team;
        team = Team.findOne(this.pick_id);
        return team;
      },
      hasStarted() {
        const game = Game.findOne({ week: this.week, game: 1 }),
            now = new Date();
        return (game.kickoff <= now);
      }
    }
  });
} else {
  SurvivorPicksConditional = new Mongo.Collection('survivor');
  SurvivorPickConditional = Class.create({
    name: 'SurvivorPick',
    collection: SurvivorPicksConditional,
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
    helpers: {
      getTeam() {
        let team;
        team = Team.findOne(this.pick_id);
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
}

export const SurvivorPicks = SurvivorPicksConditional;
export const SurvivorPick = SurvivorPickConditional;
