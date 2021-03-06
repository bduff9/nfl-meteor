import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Mailer } from 'meteor/lookback:emails';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import { TUser } from '../../imports/api/collections/users';
import { TEmailTemplate } from '../../imports/api/commonTypes';
import {
	EMAIL_SUBJECT_PREFIX,
	POOL_EMAIL_FROM,
	POOL_SITE_NAME,
} from '../../imports/api/constants';
import { humanizeVariable } from '../../imports/api/global';

import Templates from './templates';
import TemplateHelpers from './template-helpers';

Accounts.emailTemplates.siteName = POOL_SITE_NAME;
Accounts.emailTemplates.from = POOL_EMAIL_FROM;

Accounts.emailTemplates.verifyEmail = {
	subject: (): string => `${EMAIL_SUBJECT_PREFIX}Verify Your Email Address`,
	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	// @ts-ignore
	html: (user: TUser, urlWithHash: string): string => {
		const url = urlWithHash.replace('#/', '');

		console.log(`Sending Verify Email email to ${user.email}...`);

		const body = Mailer.render('verifyEmail', {
			preview:
				'Please confirm your recent registration request for the NFL Confidence Pool',
			url,
			user,
		});

		console.log(`Successfully sent Verify Email email to ${user.email}!`);

		return body;
	},
};

Accounts.emailTemplates.resetPassword = {
	subject: (): string => `${EMAIL_SUBJECT_PREFIX}Reset Password Request`,
	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	// @ts-ignore
	html: (user: TUser, urlWithHash: string): string => {
		const url = urlWithHash.replace('#/', '');

		console.log(`Sending Reset Password email to ${user.email}...`);

		const body = Mailer.render('resetPassword', {
			preview: 'We just received a password reset request from your account',
			url,
			user,
		});

		console.log(`Successfully sent Reset Password email to ${user.email}!`);

		return body;
	},
};

Mailer.config({
	from: 'Commissioner <info@asitewithnoname.com>',
	routePrefix: 'emails',
	baseUrl: process.env.ROOT_URL,
	testEmail: 'Brian Test <bduff9@gmail.com>',
	logger: console,
	silent: false,
	//TODO: go back to this once we have on page previews for the admin email screen
	addRoutes: true,
	//addRoutes: process.env.NODE_ENV === 'development',
	language: 'html',
	plainText: true,
	plainTextOpts: {}, // Options for `html-to-text` module. See all here: https://www.npmjs.com/package/html-to-text
});

Mailer.init({
	templates: Templates,
	helpers: TemplateHelpers,
	layout: {
		name: 'emailLayout',
		path: 'email/templates/layout.html',
		css: './email/bootstrap/dist/css/bootstrap.min.css',
	},
});

/**
 * Sends emails
 * Subject, template, and one of bcc or to are required
 * Attachments and data are optional (In data, preview is global to all templates (For the email preview), find all possible template specific values in templates.js)
 * Sample call from client:
		Meteor.call('Email.sendEmail', { data: { email: 'somebody@somewhere.com', facebook: false, firstName: 'Brian', google: true, password: 'Biggunz69', preview: `Thank you for signing up for the ${year} NFL Confidence Pool!`, returning: true, year: 2099 }, subject: 'Testing the pool emails', template: 'newUserWelcome', to: 'bduff9@gmail.com' }, handleError);
 * From server, simply import sendEmail and then do:
		sendEmail.call({...SAME VALUES AS ABOVE...}, handleError);
 */
export const sendEmail = new ValidatedMethod({
	name: 'Email.sendEmail',
	validate: new SimpleSchema({
		attachments: { type: [String], label: 'Attachments', optional: true },
		bcc: { type: [String], label: 'BCC Email Addresses', optional: true },
		data: { type: Object, label: 'Email Data', optional: true, blackbox: true },
		subject: { type: String, label: 'Email Subject' },
		template: {
			type: String,
			label: 'Email Template',
			allowedValues: Object.keys(Templates),
		},
		to: { type: String, label: 'Send To Email Address', optional: true },
	}).validator(),
	run ({
		attachments = [],
		bcc = [],
		data = {},
		subject,
		template,
		to = '',
	}: {
		attachments: string[];
		bcc: string[];
		data: { [k: string]: string };
		subject: string;
		template: string;
		to: string;
	}): boolean {
		const sendTo = to || bcc;

		if (!sendTo || sendTo.length === 0)
			throw new Meteor.Error(
				'Email.sendEmail.noSendToEmailFound',
				'You must include either bcc (multiple recipients) or to (single recipient) in order to send an email',
			);

		console.log(`Sending ${subject} email to ${sendTo}`);

		const isSuccessful = Mailer.send({
			to,
			subject: EMAIL_SUBJECT_PREFIX + subject,
			template,
			bcc,
			data,
			attachments,
		});

		console.log(
			isSuccessful
				? `Successfully sent ${subject} email to ${sendTo}!`
				: `${subject} email failed to send to ${sendTo}!`,
		);

		return isSuccessful;
	},
});
export const sendEmailSync = Meteor.wrapAsync(sendEmail.call, sendEmail);

export const getEmailTemplatesForAdminScreen = new ValidatedMethod({
	name: 'Email.getEmailTemplatesForAdminScreen',
	validate: new SimpleSchema({}).validator(),
	run (): TEmailTemplate[] {
		const listOfTemplates = Object.keys(Templates).map(
			(template): TEmailTemplate => ({
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				adminScreen: Templates[template].adminScreen,
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				route: Templates[template].route,
				template,
			}),
		);
		const adminTemplates = listOfTemplates.filter(
			(template): boolean => !!template.adminScreen,
		);

		return adminTemplates.map(
			({ adminScreen, route, template }): TEmailTemplate => ({
				adminScreen,
				description: humanizeVariable(template),
				route,
				template,
			}),
		);
	},
});
export const getEmailTemplatesForAdminScreenSync = Meteor.wrapAsync(
	getEmailTemplatesForAdminScreen.call,
	getEmailTemplatesForAdminScreen,
);

export const getEmailTemplateObject = new ValidatedMethod({
	name: 'Email.getEmailTemplateObject',
	validate: new SimpleSchema({
		template: { type: String, label: 'Template Key' },
	}).validator(),
	run ({ template }: { template: string }): TEmailTemplate {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		const templateObject = Templates[template];

		if (!templateObject)
			throw new Meteor.Error(
				'Email.getEmailTemplateObject.NotFound',
				`Cannot find template ${template}`,
			);

		return templateObject;
	},
});
export const getEmailTemplatePathSync = Meteor.wrapAsync(
	getEmailTemplateObject.call,
	getEmailTemplateObject,
);
