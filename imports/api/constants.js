'use strict';

/**
 * Constants for the pool
 */

/**
 * The current schema version
 * 1 - First schema
 * 2 - New schema for 2017 season
 */
export const dbVersion = 2;

/**
 * First year of tracking for system values
 */
export const FIRST_YEAR_FOR_SYSTEM_VALS = 2016;

/**
 * The cost of the pool
 */
export const POOL_COST = 40;

/**
 * The cost of the survivor pool
 */
export const SURVIVOR_COST = 5;

/**
 * Prize levels
 * Updated: 2017-10-03
 */
export const WEEKLY_PRIZES = [0, 25, 15];
export const OVERALL_PRIZES = [0, 240, 150, 100];
export const LAST_PLACE_PRIZE = POOL_COST;
export const SURVIVOR_PRIZES = [0, 50, 28];

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
	'SLACK',
	'SUBMIT_PICKS',
	'SURVIVOR_PICK'
];

/**
 * The week where misses count against players for the last place prize
 * Updated: 2018-10-02
 */
export const NO_MISS_WEEK = 5;

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
export const POOL_EMAIL_FROM = 'Commissioner <info@asitewithnoname.com>';

/**
 * The email subject prefix
 */
export const POOL_SITE_NAME = 'NFL Confidence Pool';
export const EMAIL_SUBJECT_PREFIX = `[${POOL_SITE_NAME}] `;

/**
 * The maximum length of single SMS message
 */
export const MAX_SMS_LENGTH = 160;

/**
 * All supported account types for payments
 */
export const ACCOUNT_TYPES = ['Cash', 'PayPal', 'Zelle', 'Venmo'];

/**
 * The account types that require an account name
 */
export const DIGITAL_ACCOUNTS = ['Zelle', 'PayPal', 'Venmo'];

/**
 * Types of auto picking
 */
export const AUTO_PICK_TYPES = ['Home', 'Away', 'Random'];

/**
 * Default auto pick count for users
 */
export const DEFAULT_AUTO_PICK_COUNT = 3;

/**
 * URL of Slack Invite
 */
export const SLACK_INVITE_URL = 'https://join.slack.com/t/asitewithnoname/shared_invite/enQtNDIyNzUxNTAxMzk0LTIxNmFjOWVkMDk2N2Q2ZDNmMjIxMjQ1NzgwMzUzZTFhMmU3OWIyZmVmZmQ1ZDViZmU5YTJhNmQwYjIxMjYwY2E';
