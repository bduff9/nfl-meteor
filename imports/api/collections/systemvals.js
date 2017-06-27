'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../../api/constants';

export const toggleScoreboard = new ValidatedMethod({
  name: 'SystemVal.updateScoreboard',
  validate: new SimpleSchema({
    isOpen: { type: Boolean, label: 'Is Open' }
  }).validator(),
  run({ isOpen }) {
    if (!this.userId) throw new Meteor.Error('SystemVal.updateScoreboard.not-signed-in', 'You must be logged in to update system values');
    if (Meteor.isServer) {
      const connId = this.connection.id;
      let systemVal = SystemVal.findOne(),
          conn = systemVal.current_connections[connId];
      if (conn) {
        conn.scoreboard_open = isOpen;
        systemVal.save();
      } else {
        console.log('Connection not found!');
        console.log('connection id', connId);
        console.log('connection', conn);
      }
    }
  }
});

export const SystemVals = new Mongo.Collection('systemvals');
let SystemValConditional = null;

if (dbVersion < 2) {
  SystemValConditional = Class.create({
    name: 'SystemVal',
    collection: SystemVals,
    secured: true,
    fields:{
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
    helpers: {
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
} else {
  SystemValConditional = Class.create({
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
      current_connections: {
        type: Object,
        default: () => {}
      }
    },
    helpers: {
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
}

export const SystemVal = SystemValConditional;
