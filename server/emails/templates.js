'use strict';

import { formatDate } from '../../imports/api/global';
import { getFirstGameOfWeek } from '../../imports/api/collections/games';
import { getPicksForWeek } from '../../imports/api/collections/picks';
import { getTeamByShort } from '../../imports/api/collections/teams';
import { getTiebreaker } from '../../imports/api/collections/tiebreakers';
import { getUserByID } from '../../imports/api/collections/users';

export default {
	allSubmit: {
		path: 'email/templates/all-submit.html',
		helpers: {},
		route: {
			path: '/all-submit',
			data: ({ query }) => {
				const { userID, week } = query;
				const user = getUserByID.call({ user_id: userID });

				return {
					user,
					week,
				};
			},
		},
	},

	approveUser: {
		path: 'email/templates/approve-user.html',
		helpers: {},
		route: {
			path: '/approve-user',
			data: ({ query }) => {
				const { adminID, newUserID } = query;
				const admin = getUserByID.call({ user_id: adminID });
				const newUser = getUserByID.call({ user_id: newUserID });

				return {
					admin,
					newUser,
				};
			},
		},
	},

	interest: {
		path: 'email/templates/interest-email.html',
		helpers: {},
		route: {
			path: '/interest',
			data: ({ query }) => ({}),
		},
	},

	newUser: {
		path: 'email/templates/new-user.html',
		helpers: {
			now () {
				return formatDate(new Date(), true);
			},
		},
		route: {
			path: '/new-user',
			data: ({ query }) => {
				const { adminID, newUserID } = query;
				const admin = getUserByID.call({ user_id: adminID });
				const newUser = getUserByID.call({ user_id: newUserID });

				return {
					admin,
					newUser,
				};
			},
		},
	},

	newUserWelcome: {
		path: 'email/templates/welcome-email.html',
		helpers: {},
		route: {
			path: '/welcome-email',
			data: ({ query }) => {
				const { returning, userID, year } = query;
				const user = getUserByID.call({ user_id: userID });

				return {
					returning: returning === 'true',
					user,
					year,
				};
			},
		},
	},

	picksConfirm: {
		path: 'email/templates/picks-confirmation.html',
		helpers: {
			sortPicks (picks) {
				return picks.sort((pick1, pick2) => {
					if (pick1.points > pick2.points) return -1;
					if (pick1.points < pick2.points) return 1;

					return 0;
				});
			},
		},
		route: {
			path: '/picks-confirmation',
			data: ({ query }) => {
				const { league, userID: user_id, week: weekStr } = query;
				const week = parseInt(weekStr, 10);
				const user = getUserByID.call({ user_id });
				const picks = getPicksForWeek.call({ league, user_id, week });
				const tiebreaker = getTiebreaker.call({ league, user_id, week });

				return {
					picks,
					tiebreaker,
					user,
					week,
				};
			},
		},
	},

	quickPick: {
		path: 'email/templates/quick-pick.html',
		extraCSS: 'email/quick-picks.css', // Use this for media queries as it won't be inlined
		helpers: {},
		route: {
			path: '/quick-pick',
			data: ({ query }) => {
				const { hours, userID: user_id, week: weekStr } = query;
				const week = parseInt(weekStr, 10);
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
	},

	quickPickConfirm: {
		path: 'email/templates/quick-pick-confirm.html',
		helpers: {},
		route: {
			path: '/quick-pick-confirm',
			data: ({ query }) => {
				const { teamShort: short_name, userID: user_id, week } = query;
				const user = getUserByID.call({ user_id });
				const team = getTeamByShort.call({ short_name });

				return {
					team,
					user,
					week,
				};
			},
		},
	},

	reminder: {
		path: 'email/templates/reminder.html',
		helpers: {},
		route: {
			path: '/reminder',
			data: ({ query }) => {
				const { hours, userID: user_id, week } = query;
				const user = getUserByID.call({ user_id });

				return {
					hours,
					user,
					week,
				};
			},
		},
	},

	resetPassword: {
		path: 'email/templates/reset-password.html',
		helpers: {},
		route: {
			path: '/reset-password',
			data: ({ query }) => {
				const { url, userID: user_id } = query;
				const user = getUserByID.call({ user_id });

				return {
					url,
					user,
				};
			},
		},
	},

	verifyEmail: {
		path: 'email/templates/verify-email.html',
		helpers: {},
		route: {
			path: '/verify',
			data: ({ query }) => {
				const { url, userID: user_id } = query;
				const user = getUserByID.call({ user_id });

				return {
					url,
					user,
				};
			},
		},
	},

	weeklyEmail: {
		path: 'email/templates/pool-email.html',
		helpers: {},
		route: {
			path: '/pool-email',
			data: ({ query }) => ({
				message: query.message,
			}),
		},
	},
};
