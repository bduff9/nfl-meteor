'use strict';

import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';

import { dbVersion } from '../../api/constants';

/**
 * All tiebreaker logic
 * @since 2017-06-26
 */

let TiebreakersConditional = null;
let TiebreakerConditional = null;

if (dbVersion < 2) {
  TiebreakerConditional = Class.create({
    name: 'Tiebreaker',
    secured: true,
    fields: {
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
    }
  });
} else {
  TiebreakersConditional = new Mongo.Collection('tiebreakers');
  TiebreakerConditional = Class.create({
  name: 'Tiebreaker',
  collection: TiebreakersConditional,
  secured: true,
  fields: {
    user_id: String,
    league: {
      type: String,
      default: 'public'
    },
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
}

export const Tiebreakers = TiebreakersConditional;
export const Tiebreaker = TiebreakerConditional;
