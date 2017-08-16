'use strict';

import { Accounts } from 'meteor/accounts-base';
import { Mailer } from 'meteor/lookback:emails';

import Templates from './templates';
import TemplateHelpers from './template-helpers';

Accounts.emailTemplates.siteName = 'NFL Confidence Pool';
Accounts.emailTemplates.from     = 'Brian Duffey <bduff9@gmail.com>';

Accounts.emailTemplates.verifyEmail = {
	subject () {
		return '[NFL Confidence Pool] Verify Your Email Address';
	},
	text (user, url) {
		let emailAddress   = user.email,
				urlWithoutHash = url.replace('#/', ''),
				emailBody      = `To verify your email address (${emailAddress}) visit the following link:\n\n${urlWithoutHash}\n\n If you did not request this verification, please ignore this email.`;
		return emailBody;
	}
};

Accounts.emailTemplates.resetPassword = {
	subject () {
		return '[NFL Confidence Pool] Reset Password Request';
	},
	text (user, url) {
		let urlWithoutHash = url.replace('#/', '');
		return `To reset your password, simply click the link below:\n\n${urlWithoutHash}`;
	}
};

Mailer.config({
	from: 'Billy Admin <billy@asitewithnoname.com>',     // Default 'From:' address. Required.
	routePrefix: 'emails',              // Route prefix.
	baseUrl: process.env.ROOT_URL,      // The base domain to build absolute link URLs from in the emails.
	testEmail: 'Billy User <balexander82@aol.com>',                    // Default address to send test emails to.
	logger: console,                     // Injected logger (see further below)
	silent: false,                      // If set to `true`, any `Logger.info` calls won't be shown in the console to reduce clutter.
	addRoutes: process.env.NODE_ENV === 'development', // Add routes for previewing and sending emails. Defaults to `true` in development.
	language: 'html',                    // The template language to use. Defaults to 'html', but can be anything Meteor SSR supports (like Jade, for instance).
	plainText: true,                     // Send plain text version of HTML email as well.
	plainTextOpts: {}                   // Options for `html-to-text` module. See all here: https://www.npmjs.com/package/html-to-text
});

Mailer.init({
	templates: Templates,        // Required. A key-value hash where the keys are the template names. See more below.
	helpers: TemplateHelpers,          // Global helpers available for all templates.
	layout: {
		name: 'emailLayout',
		path: 'email/templates/layout.html',
		scss: './email/email.scss'
	},
});

