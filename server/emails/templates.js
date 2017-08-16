'use strict';

/*export default {
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
			path: '/new-user',
			data: (params) => ({
				names: ['Johan', 'John', 'Paul', 'Ringo']
			})
		}
	}
};

