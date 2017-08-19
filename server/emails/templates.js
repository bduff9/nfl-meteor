'use strict';

export default {
	newUserWelcome: {
		path: 'email/templates/welcome-email.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.
		extraCSS: 'email/media-email.css',
		helpers: {},
		route: {
			path: '/new-user',
			data: params => ({})
		}
	},

	interest: {
		path: 'email/templates/interest-email.html',
		helpers: {},
		route: {
			path: '/interest',
			data: params => ({})
		}
	},

	verifyEmail: {
		path: 'email/templates/verify-email.html',
		helpers: {},
		route: {
			path: '/verify',
			data: params => ({})
		}
	},

	picksConfirm: {
		path: 'email/templates/picks-confirmation.html',
		helpers: {},
		route: {
			path: '/picks-confirmation',
			data: params => ({})
		}
	},

	quickPick: {
		path: 'email/templates/quick-pick.html',
		helpers: {},
		route: {
			path: '/quick-pick',
			data: params => ({})
		}
	},

	reminder: {
		path: 'email/templates/reminder.html',
		helpers: {},
		route: {
			path: '/reminder',
			data: params => ({})
		}
	},

	resetPassword: {
		path: 'email/templates/reset-password.html',
		helpers: {},
		route: {
			path: '/reset-password',
			data: params => ({})
		}
	}
};
