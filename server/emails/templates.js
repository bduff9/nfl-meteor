'use strict';

export default {
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
				password: query.password,
				returning: !!query.returning,
				year: query.year
			})
		}
	},

	interest: {
		path: 'email/templates/interest-email.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/interest',
			data: ({ query }) => ({})
		}
	},

	verifyEmail: {
		path: 'email/templates/verify-email.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/verify',
			data: ({ query }) => ({})
		}
	},

	picksConfirm: {
		path: 'email/templates/picks-confirmation.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/picks-confirmation',
			data: ({ query }) => ({})
		}
	},

	quickPick: {
		path: 'email/templates/quick-pick.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/quick-pick',
			data: ({ query }) => ({})
		}
	},

	reminder: {
		path: 'email/templates/reminder.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/reminder',
			data: ({ query }) => ({})
		}
	},

	resetPassword: {
		path: 'email/templates/reset-password.html',
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/reset-password',
			data: ({ query }) => ({})
		}
	}
};
