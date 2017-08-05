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
 * Prize levels
 */
export const WEEKLY_PRIZES = [0, 15, 7];
export const OVERALL_PRIZES = [0, 200, 150, 100];
export const LAST_PLACE_PRIZE = POOL_COST;
export const SURVIVOR_PRIZES = [0, 50, 25];

/**
 * How many to insert into the pool history
 */
export const TOP_WEEKLY_FOR_HISTORY = WEEKLY_PRIZES.length - 1;
export const TOP_OVERALL_FOR_HISTORY = OVERALL_PRIZES.length - 1;
export const TOP_SURVIVOR_FOR_HISTORY = SURVIVOR_PRIZES.length - 1;

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
 * The week where misses count against players for the last place prize
 */
export const NO_MISS_WEEK = 3;

/**
 * Payment due by end of this week
 */
export const PAYMENT_DUE_WEEK = 3;

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

/**
 * The outgoing email address
 */
export const POOL_EMAIL_FROM = 'NFL Pool Admin <info@asitewithnoname.com>';

/**
 * All supported account types for payments
 */
export const ACCOUNT_TYPES = ['Cash', 'PayPal', 'QuickPay', 'Venmo'];

/**
 * The account types that require an account name
 */
export const DIGITAL_ACCOUNTS = ['QuickPay', 'PayPal', 'Venmo'];
