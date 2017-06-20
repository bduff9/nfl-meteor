/*jshint esversion: 6 */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Migrations } from 'meteor/percolate:migrations';

const make2017Changes = function make2017Changes () {
  //TODO
};

const undo2017Changes = function undo2017Changes () {
  //TODO
};

Migrations.add({
  version: 2,
  name: 'Changes for 2017 season i.e. un-embed schemas and new user values',
  up: make2017Changes,
  down: undo2017Changes
});

Meteor.startup(function () {
  Migrations.migrateTo('latest');
});
