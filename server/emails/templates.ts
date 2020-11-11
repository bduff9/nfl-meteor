import {
	POOL_COST,
	SURVIVOR_COST,
	ALL_WEEKS,
} from '../../imports/api/constants';
import { formatDate } from '../../imports/api/global';
import {
	getFirstGameOfWeek,
	getPaymentDue,
} from '../../imports/api/collections/games';
import { getPicksForWeek, TPick } from '../../imports/api/collections/picks';
import { getTeamByShort, TTeam } from '../../imports/api/collections/teams';
import {
	getTiebreaker,
	TTiebreaker,
} from '../../imports/api/collections/tiebreakers';
import { getUserByID, TUser } from '../../imports/api/collections/users';
import {
	TAdminMessage,
	TSortResult,
	TWeek,
} from '../../imports/api/commonTypes';

type TEmailData = {
	query: {
		[k: string]: string;
	};
};

const convertStringToWeek = (week: string): TWeek => {
	const weekIndex = parseInt(week, 10) - 1;

	if (ALL_WEEKS[weekIndex]) return ALL_WEEKS[weekIndex];

	return 1;
};

export default {
	adminNotice: {
		path: 'email/templates/admin-notice.html',
		helpers: {},
		route: {
			path: '/admin-notice',
			data: ({
				query,
			}: TEmailData): {
				messages: TAdminMessage[];
				week: TWeek;
			} => {
				const { messages: messagesStr, week: weekStr } = query;
				const messages = JSON.parse(messagesStr) as TAdminMessage[];
				const week = convertStringToWeek(weekStr);

				return {
					messages,
					week,
				};
			},
		},
		adminScreen: false,
	},

	allSubmit: {
		path: 'email/templates/all-submit.html',
		helpers: {},
		route: {
			path: '/all-submit',
			data: ({ query }: TEmailData): { user: TUser; week: TWeek } => {
				const { userID, week: weekStr } = query;
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user = getUserByID.call({ user_id: userID });
				const week = convertStringToWeek(weekStr);

				return {
					user,
					week,
				};
			},
		},
		adminScreen: false,
	},

	approveUser: {
		path: 'email/templates/approve-user.html',
		helpers: {},
		route: {
			path: '/approve-user',
			data: ({ query }: TEmailData): { admin: TUser; newUser: TUser } => {
				const { adminID, newUserID } = query;
				// eslint-disable-next-line @typescript-eslint/camelcase
				const admin = getUserByID.call({ user_id: adminID });
				// eslint-disable-next-line @typescript-eslint/camelcase
				const newUser = getUserByID.call({ user_id: newUserID });

				return {
					admin,
					newUser,
				};
			},
		},
		adminScreen: false,
	},

	interest: {
		path: 'email/templates/interest-email.html',
		helpers: {},
		route: {
			path: '/interest',
			data: (): {
				payByDate: string;
				poolCost: number;
				survivorCost: number;
			} => {
				const paymentDue = getPaymentDue.call({});

				return {
					payByDate: formatDate(paymentDue),
					poolCost: POOL_COST,
					survivorCost: SURVIVOR_COST,
				};
			},
		},
		adminScreen: {
			path: '',
			emailBody: false,
		},
	},

	newUser: {
		path: 'email/templates/new-user.html',
		helpers: {
			now: (): string => formatDate(new Date(), true),
		},
		route: {
			path: '/new-user',
			data: ({ query }: TEmailData): { admin: TUser; newUser: TUser } => {
				const { adminID, newUserID } = query;
				// eslint-disable-next-line @typescript-eslint/camelcase
				const admin = getUserByID.call({ user_id: adminID });
				// eslint-disable-next-line @typescript-eslint/camelcase
				const newUser = getUserByID.call({ user_id: newUserID });

				return {
					admin,
					newUser,
				};
			},
		},
		adminScreen: false,
	},

	newUserWelcome: {
		path: 'email/templates/welcome-email.html',
		helpers: {},
		route: {
			path: '/welcome-email',
			data: ({
				query,
			}: TEmailData): { returning: boolean; user: TUser; year: number } => {
				const { returning, userID, year: yearStr } = query;
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user = getUserByID.call({ user_id: userID });
				const year = parseInt(yearStr, 10);

				return {
					returning: returning === 'true',
					user,
					year,
				};
			},
		},
		adminScreen: false,
	},

	picksConfirm: {
		path: 'email/templates/picks-confirmation.html',
		helpers: {
			sortPicks: (picks: TPick[]): TPick[] =>
				picks.sort(
					({ points: pointsRaw1 }, { points: pointsRaw2 }): TSortResult => {
						const points1 = pointsRaw1 || 0;
						const points2 = pointsRaw2 || 0;

						if (points1 > points2) return -1;

						if (points1 < points2) return 1;

						return 0;
					},
				),
		},
		route: {
			path: '/picks-confirmation',
			data: ({
				query,
			}: TEmailData): {
				picks: TPick[];
				tiebreaker: TTiebreaker;
				user: TUser;
				week: TWeek;
			} => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const { league, userID: user_id, week: weekStr } = query;
				const week = convertStringToWeek(weekStr);
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user = getUserByID.call({ user_id });
				// eslint-disable-next-line @typescript-eslint/camelcase
				const picks = getPicksForWeek.call({ league, user_id, week });
				// eslint-disable-next-line @typescript-eslint/camelcase
				const tiebreaker = getTiebreaker.call({ league, user_id, week });

				return {
					picks,
					tiebreaker,
					user,
					week,
				};
			},
		},
		adminScreen: false,
	},

	quickPick: {
		path: 'email/templates/quick-pick.html',
		extraCSS: 'email/quick-picks.css', // Use this for media queries as it won't be inlined
		helpers: {},
		route: {
			path: '/quick-pick',
			data: ({
				query,
			}: TEmailData): {
				hours: string;
				team1: TTeam;
				team2: TTeam;
				user: TUser;
				week: TWeek;
			} => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const { hours, userID: user_id, week: weekStr } = query;
				const week = convertStringToWeek(weekStr);
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user = getUserByID.call({ user_id });
				const game = getFirstGameOfWeek.call({ week });
				const team1 = game.getTeam('home');
				const team2 = game.getTeam('visitor');

				return {
					hours,
					team1,
					team2,
					user,
					week,
				};
			},
		},
		adminScreen: false,
	},

	quickPickConfirm: {
		path: 'email/templates/quick-pick-confirm.html',
		helpers: {},
		route: {
			path: '/quick-pick-confirm',
			data: ({
				query,
			}: TEmailData): { team: TTeam; user: TUser; week: TWeek } => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const { teamShort: short_name, userID: user_id, week: weekStr } = query;
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user = getUserByID.call({ user_id });
				// eslint-disable-next-line @typescript-eslint/camelcase
				const team = getTeamByShort.call({ short_name });
				const week = convertStringToWeek(weekStr);

				return {
					team,
					user,
					week,
				};
			},
		},
		adminScreen: false,
	},

	reminder: {
		path: 'email/templates/reminder.html',
		helpers: {},
		route: {
			path: '/reminder',
			data: ({
				query,
			}: TEmailData): { hours: number; user: TUser; week: TWeek } => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const { hours: hoursStr, userID: user_id, week: weekStr } = query;
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user = getUserByID.call({ user_id });
				const hours = parseInt(hoursStr, 10);
				const week = convertStringToWeek(weekStr);

				return {
					hours,
					user,
					week,
				};
			},
		},
		adminScreen: false,
	},

	resetPassword: {
		path: 'email/templates/reset-password.html',
		helpers: {},
		route: {
			path: '/reset-password',
			data: ({ query }: TEmailData): { url: string; user: TUser } => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const { url, userID: user_id } = query;
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user = getUserByID.call({ user_id });

				return {
					url,
					user,
				};
			},
		},
		adminScreen: false,
	},

	verifyEmail: {
		path: 'email/templates/verify-email.html',
		helpers: {},
		route: {
			path: '/verify',
			data: ({ query }: TEmailData): { url: string; user: TUser } => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const { url, userID: user_id } = query;
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user = getUserByID.call({ user_id });

				return {
					url,
					user,
				};
			},
		},
		adminScreen: false,
	},

	weeklyEmail: {
		path: 'email/templates/pool-email.html',
		helpers: {},
		route: {
			path: '/pool-email',
			data: ({ query }: TEmailData): { message: string } => ({
				message: query.message,
			}),
		},
		adminScreen: {
			emailBody: 'message',
		},
	},
};
