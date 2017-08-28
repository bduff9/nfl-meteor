'use strict';

export default {
	interest: {
		path: 'email/templates/interest-email.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/interest',
			data: ({ query }) => ({})
		}
	},

	allSubmit: {
		path: 'email/templates/all-submit.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/allsubmit',
			data: ({ query }) => ({
				firstName: query.firstName,
				week: query.week
			})
		}
	},

	newUserWelcome: {
		path: 'email/templates/welcome-email.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/new-user',
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
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/picks-confirmation',
			data: ({ query }) => ({
				firstName: query.firstName,
				week: query.week
			})
		}
	},

	quickPick: {
		path: 'email/templates/quick-pick.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/quick-pick',
			data: ({ query }) => ({
				firstName: query.firstName,
				hours: query.hours,
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
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/quick-pick-confirm',
			data: ({ query }) => ({
				firstName: query.firstName
			})
		}
	},

	reminder: {
		path: 'email/templates/reminder.html',
		extraCSS: 'email/media-email.css',
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
		extraCSS: 'email/media-email.css',
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
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/verify',
			data: ({ query }) => ({
				email: query.email,
				firstName: query.firstName,
				url: query.url
			})
		}
	},

	weeklyEmail: {
		path: 'email/templates/pool-email.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/pool-email',
			data: ({ query }) => ({
				message: query.message
			})
		}
	}
};
