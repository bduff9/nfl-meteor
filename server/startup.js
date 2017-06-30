/* globals Modules */
'use strict';

import { Meteor } from 'meteor/meteor';

Meteor.startup(() => Modules.server.startup());
