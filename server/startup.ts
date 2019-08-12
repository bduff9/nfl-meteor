/* globals Modules */
import { Meteor } from 'meteor/meteor';

Meteor.startup((): void => Modules.server.startup());
