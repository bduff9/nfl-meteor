'use strict';

export default {
	allSubmit: {
		path: 'email/templates/all-submit.html',
		helpers: {},
		route: {
			path: '/all-submit',
			data: ({ query }) => ({
				firstName: query.firstName,
				week: query.week
			})
		}
	},

	approveUser: {
		path: 'email/templates/approve-user.html',
		helpers: {},
		route: {
			path: '/approve-user',
			data: ({ query }) => ({
				firstName: query.firstName,
				newUser: query.newUser
			})
		}
	},

	interest: {
		path: 'email/templates/interest-email.html',
		helpers: {},
		route: {
			path: '/interest',
			data: ({ query }) => ({})
		}
	},

	newUser: {
		path: 'email/templates/new-user.html',
		helpers: {},
		route: {
			path: '/new-user',
			data: ({ query }) => ({
				firstName: query.firstName,
				newUser: query.newUser,
				now: query.now
			})
		}
	},

	newUserWelcome: {
		path: 'email/templates/welcome-email.html',
		helpers: {},
		route: {
			path: '/welcome-email',
			data: ({ query }) => ({
				email: query.email,
				facebook: !!query.facebook,
				firstName: query.firstName,
				google: !!query.google,
				returning: !!query.returning,
				year: query.year
			})
		}
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
			}
		},
		route: {
			path: '/picks-confirmation',
			data: ({ query }) => ({
				firstName: query.firstName,
				picks: query.picks,
				tiebreaker: query.tiebreaker,
				week: query.week
			})
		}
	},

	quickPick: {
		path: 'email/templates/quick-pick.html',
		extraCSS: 'email/quick-picks.css', // Use this for media queries as it won't be inlined
		helpers: {},
		route: {
			path: '/quick-pick',
			data: ({ query }) => ({
				firstName: query.firstName,
				hours: query.hours,
				team1Color1: query.team1Color1,
				team1Color2: query.team1Color2,
				team2Color1: query.team2Color1,
				team2Color2: query.team2Color2,
				teamName1: query.teamName1,
				teamName2: query.teamName2,
				teamShort1: query.teamShort1,
				teamShort2: query.teamShort2,
				userId: query.userId,
				week: query.week
			})
		}
	},

	quickPickConfirm: {
		path: 'email/templates/quick-pick-confirm.html',
		helpers: {},
		route: {
			path: '/quick-pick-confirm',
			data: ({ query }) => ({
				firstName: query.firstName,
				week: query.week
			})
		}
	},

	reminder: {
		path: 'email/templates/reminder.html',
		helpers: {},
		route: {
			path: '/reminder',
			data: ({ query }) => ({
				firstName: query.firstName,
				hours: query.hours,
				week: query.week
			})
		}
	},

	resetPassword: {
		path: 'email/templates/reset-password.html',
		helpers: {},
		route: {
			path: '/reset-password',
			data: ({ query }) => ({
				firstName: query.firstName,
				url: query.url
			})
		}
	},

	verifyEmail: {
		path: 'email/templates/verify-email.html',
		helpers: {},
		route: {
			path: '/verify',
			data: ({ query }) => ({
				email: query.email,
				url: query.url
			})
		}
	},

	weeklyEmail: {
		path: 'email/templates/pool-email.html',
		helpers: {},
		route: {
			path: '/pool-email',
			data: ({ query }) => ({
				message: query.message
			})
		}
	}
};
