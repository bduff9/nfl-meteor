'use strict';

import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

/**
 * Before new year begins, reset all data i.e. clear out games, teams, picks, etc. and reset users back to empty
 */

export const resetPool = new ValidatedMethod({
	name: 'Pool.reset',
	validate: new SimpleSchema({}).validator(),
	run() {
		//TODO: grab overall top 3 and insert into poolhistory
		//TODO: empty all collections we are going to refill: cronHistory, games, nfllogs, picks, survivor, teams, tiebreakers
		//TODO: refill teams then games
		//TODO: clear out/default old user info i.e. referred_by, done_registering, leagues, survivor, owe, paid, selected_week, total_points, total_games, overall_place, overall_tied_flag
		//TODO: when done, update lastUpdated in systemvals
	}
});
