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
 * How many to insert into the pool history
 */
export const TOP_WEEKLY_FOR_HISTORY = 2;
export const TOP_OVERALL_FOR_HISTORY = 3;

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

/**
 * The first week of the season
 */
export const MIN_WEEK = 1;

/**
 * The total number of weeks in an NFL regular season
 */
export const WEEKS_IN_SEASON = 17;

/**
 * Maximum games in any 1 week
 */
export const MAX_GAMES_IN_WEEK = 16;
