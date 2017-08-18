'use strict';

/*export {
	interest: {
		path: 'email/templates/interest-email.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.
		helpers: {},
		route: {
			path: '/interest',
			data: (params) => ({
				names: ['Johan', 'John', 'Paul', 'Ringo']
			})
		}
	}
};
*/

export default{
	newUserWelcome: {
		path: 'email/templates/welcome-email.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.
		helpers: {},
		route: {
			path: '/new-user'
		}
	}
};

/*export {
	verifyEmail: {
		path: 'email/templates/verify-email.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.
		helpers: {},
		route: {
			path: '/verify'
		}
	}
};

export {
	picksConfirm: {
		path: 'email/templates/picks-confirmation.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.
		helpers: {},
		route: {
			path: '/picks-confirmation'
		}
	}
};

export {
	quickPick: {
		path: 'email/templates/quick-pick.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.
		helpers: {},
		route: {
			path: '/quick-pick'
		}
	}
};


export {
	reminder: {
		path: 'email/templates/reminder.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.
		helpers: {},
		route: {
			path: '/reminder'
		}
	}
};

export {
	reminder: {
		path: 'email/templates/reset-password.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.
		helpers: {},
		route: {
			path: '/reset-password'
		}
	}
};
*/