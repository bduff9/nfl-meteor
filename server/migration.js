/*jshint esversion: 6 */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Migrations } from 'meteor/percolate:migrations';

import { Picks, PoolHistorys, SurvivorPicks, Tiebreakers } from '../imports/api/schema';

const initialDB = function initialDB (migration) {
  const Teams = new Mongo.Collection('teams');
  const Games = new Mongo.Collection('games');
  const NFLLogs = new Mongo.Collection('nfllogs');
  const SystemVals = new Mongo.Collection('systemvals');
};

const make2017Changes = function make2017Changes (migration) {
console.log(migration);
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
    //TODO set new field values with defaults
  });
  //TODO get rankings by week and overall for insert into pool history
};

const undo2017Changes = function undo2017Changes (migration) {
console.log('migration', migration);
  const users = Meteor.users.find({});
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
  name: 'Changes for 2017 season i.e. un-embed schemas and new user values',
  up: make2017Changes,
  down: undo2017Changes
});

Meteor.startup(function () {
  //Migrations.migrateTo('1');
  Migrations.migrateTo('latest');
});
