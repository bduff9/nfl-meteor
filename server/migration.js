/*jshint esversion: 6 */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Migrations } from 'meteor/percolate:migrations';

import { dbVersion } from '../imports/api/constants';
import { Games } from '../imports/api/collections/games';
import { NFLLogs } from '../imports/api/collections/nfllogs';
import { Picks } from '../imports/api/collections/picks';
import { PoolHistorys } from '../imports/api/collections/poolhistorys';
import { SurvivorPicks } from '../imports/api/collections/survivorpicks';
import { SystemVals } from '../imports/api/collections/systemvals';
import { Teams } from '../imports/api/collections/teams';
import { Tiebreakers } from '../imports/api/collections/tiebreakers';

const initialDB = function initialDB (migration) {
  // NOOP as astronomy handles this
};

const make2017Changes = function make2017Changes (migration) {
  const users = Meteor.users.find({});
  const DEF_LEAGUE = 'public';
  //TODO migrate data to new structures
  users.forEach(user => {
    const id = user._id;
    const { picks, survivor, tiebreakers } = user;
    picks.forEach(pick => {
      pick.user_id = id;
      pick.league = DEF_LEAGUE;
      Picks.insert(pick);
    });
    survivor.forEach(surv => {
      surv.user_id = id;
      surv.league = DEF_LEAGUE;
      SurvivorPicks.insert(surv);
    });
    tiebreakers.forEach(tb => {
      tb.user_id = id;
      tb.league = DEF_LEAGUE;
      Tiebreakers.insert(tb);
    });
    //TODO delete values from user BE CAREFUL WITH THIS AS IF YOU DO THIS AND DON'T DO BELOW, YOU WILL LOSE DATA
  });
  //TODO get rankings by week and overall for insert into pool history
};

const undo2017Changes = function undo2017Changes (migration) {
  const users = Meteor.users.find({});
  const Picks = new Mongo.Collection('picks');
  const Tiebreakers = new Mongo.Collection('tiebreakers');
  const SurvivorPicks = new Mongo.Collection('survivor');
  const PoolHistorys = new Mongo.Collection('poolhistorys');
  //TODO migrate data back to old structures - IMPORTANT TO DO THIS PRIOR TO DELETING VALUES ABOVE!!!
  users.forEach(user => {
    const id = user._id;
    //TODO get all picks, tiebreakers, survivor by user id
    //TODO delete user id and league and then insert into this user
    //TODO delete new fields from above
  });
  // Delete new db structures after previous so we don't lose data
  Picks.rawCollection().drop();
  Tiebreakers.rawCollection().drop();
  SurvivorPicks.rawCollection().drop();
  PoolHistorys.rawCollection().drop();
};


Migrations.add({
  version: 1,
  name: 'Initial db structure',
  up: initialDB
});

Migrations.add({
  version: 2,
  name: 'Changes for 2017 season i.e. un-embed collections and add new user values',
  up: make2017Changes,
  down: undo2017Changes
});

Meteor.startup(function () {
  Migrations.migrateTo(dbVersion);
});
