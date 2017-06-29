'use strict';

/**
 * Constants for the pool
 */

/**
 * The current schema version
 * 1 - First schema
 * 2 - New schema for 2017 season
 */
export const dbVersion = '2';

/**
 * The cost of the pool
 */
export const POOL_COST = 30;

/**
 * The cost of the survivor pool
 */
export const SURVIVOR_COST = 5;

/**
 * Actions for logging
 */
export const ACTIONS = [
	'404',
	'CHAT',
	'CHAT_HIDDEN',
	'CHAT_OPENED',
	'LOGIN',
	'LOGOUT',
	'MESSAGE',
	'PAID',
	'REGISTER',
	'SUBMIT_PICKS',
	'SURVIVOR_PICK'
];

/**
 * The default league
 */
export const DEFAULT_LEAGUE = 'public';
