'use strict';

import { Game } from '../imports/api/schema';
import { initSchedule } from '../imports/api/collections/games';
import { displayError } from '../imports/api/global';

if (Game.find().count() === 0) {
  console.log('Begin populating schedule...');
  initSchedule.call(displayError);
  console.log('Populating schedule completed!');
}