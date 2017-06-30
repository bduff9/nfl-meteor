'use strict';

import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../../api/constants';

/**
 * All pool history logic
 * @since 2017-06-26
 */

export const addPoolHistory = new ValidatedMethod({
	name: 'PoolHistorys.addPoolHistory',
	validate: new SimpleSchema({
		poolHistory: { type: Object, label: 'Pool History' }
	}).validator(),
	run ({ poolHistory }) {
		const newHistory = new PoolHistory(poolHistory);
		newHistory.save();
	}
});

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
			week: {
				type: Number,
				optional: true
			},
			place: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }]
			}
		}
	});
}

//const PoolHistorys = PoolHistorysConditional;
const PoolHistory = PoolHistoryConditional;
