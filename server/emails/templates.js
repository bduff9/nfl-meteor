export default {
	sample: {
		path: 'email/templates/interest-email.html',    // Relative to the 'private' dir.
		//scss: 'email/email.scss',       // Mail specific SCSS.

		helpers: {},

		route: {
			path: '/email-test',
			data: (params) => ({
				names: ['Johan', 'John', 'Paul', 'Ringo']
			})
		}
	}
};
