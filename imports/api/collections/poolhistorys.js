'use strict';


import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';

import { dbVersion } from '../../api/constants';

/**
 * All pool history logic
 * @since 207-06-26
 */

let PoolHistorysConditional = null;
let PoolHistoryConditional = null;

if (dbVersion > 1) {
  PoolHistorysConditional = new Mongo.Collection('poolhistory');
  PoolHistoryConditional = Class.create({
    name: 'PoolHistory',
    collection: PoolHistorysConditional,
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
}

export const PoolHistorys = PoolHistorysConditional;
export const PoolHistory = PoolHistoryConditional;
