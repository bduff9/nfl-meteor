import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC, useState, useEffect, FormEvent } from 'react';
import Helmet from 'react-helmet';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';

import { getAdminUsers, TUser } from '../../api/collections/users';
import { TError, TEmailTemplate } from '../../api/commonTypes';
import { EMAIL_SUBJECT_PREFIX } from '../../api/constants';
import { handleError } from '../../api/global';

import { TAdminFilter } from './AdminUsers';
import Loading from './Loading';

export type TAdminEmailProps = {
	pageReady: boolean;
	users: TUser[];
};

const AdminEmail: FC<TAdminEmailProps> = ({
	pageReady,
	users,
}): JSX.Element => {
	const [emailBody, setEmailBody] = useState<string>('');
	const [emailSubject, setEmailSubject] = useState<string>(
		EMAIL_SUBJECT_PREFIX,
	);
	const [emailTemplate, setEmailTemplate] = useState<string>('');
	const [emailTo, setEmailTo] = useState<string>('');
	const [templates, setTemplates] = useState<TEmailTemplate[]>([]);

	useEffect((): void => {
		Meteor.call(
			'Email.getEmailTemplatesForAdminScreen',
			{},
			(_: TError, templates: TEmailTemplate[]) => {
				setTemplates(templates);
			},
		);
	}, []);

	const _getMailingList = (type: TAdminFilter): void => {
		let mailingList = '';

		if (users) {
			const filteredUsers = users.filter(
				(user): boolean => {
					switch (type) {
						case 'Registered':
							return user.done_registering;
						case 'Owe $':
							return user.owe !== user.paid;
						case 'Rookies':
							return user.years_played.length === 1 && user.done_registering;
						case 'Veterans':
							return user.years_played.length > 1 && user.done_registering;
						case 'Incomplete':
							return !user.trusted;
						case 'Inactive':
							return !!user.trusted && !user.done_registering;
						case 'All':
							return true;
						default:
							console.error('Invalid filter passed', type);

							return false;
					}
				},
			);

			mailingList = filteredUsers.map(user => user.email).join(',');
		}

		setEmailTo(mailingList);
	};

	const _previewEmail = (): void => {
		Meteor.call(
			'Email.getEmailTemplateObject',
			{ template: emailTemplate },
			(_: TError, templateObj: TEmailTemplate) => {
				const templatePath = templateObj.route.path;
				const { adminScreen } = templateObj;
				const field = adminScreen && adminScreen.emailBody;
				let url = `/emails/preview${templatePath}`;

				if (field) url += `?${field}=${emailBody}`;

				//TODO: can we bring in actual template and show what the email will look like on the same page?  Looks possible with Mailer.precompile (returns a blaze template) or Mailer.render (returns HTML string).  Would need to set up server method to accept template and/or data and then display it on screen somewhere
				window.open(url, '_preview_email');
			},
		);
	};

	const _sendEmail = (): void => {
		const subject = emailSubject.replace(EMAIL_SUBJECT_PREFIX, '');
		const bcc = emailTo.split(',');

		Meteor.call(
			'Email.sendEmail',
			{
				bcc,
				data: {
					message: emailBody,
					preview:
						'Here is your official weekly email from the NFL Confidence Pool commissioners',
				},
				subject,
				template: emailTemplate,
			},
			(err: TError): void => {
				if (err) {
					handleError(err);
				} else {
					Bert.alert({
						icon: 'fas fa-check',
						message: 'Email has been successfully sent!',
						type: 'success',
					});
					setEmailBody('');
					setEmailSubject(EMAIL_SUBJECT_PREFIX);
					setEmailTo('');
				}
			},
		);
	};

	const _updateEmailSubject = (ev: FormEvent<HTMLInputElement>): void => {
		const emailSubject = ev.currentTarget.value;

		setEmailSubject(emailSubject);
	};

	const _updateEmailTemplate = (ev: FormEvent<HTMLSelectElement>): void => {
		const emailTemplate = ev.currentTarget.value;

		setEmailTemplate(emailTemplate);
	};

	const _updateEmailTo = (ev: FormEvent<HTMLTextAreaElement>): void => {
		const emailTo = ev.currentTarget.value;

		setEmailTo(emailTo);
	};

	return (
		<div className="row admin-wrapper admin-email-wrapper">
			<Helmet title="Email Users" />
			{pageReady ? (
				<div className="col-12">
					<h3 className="title-text text-center text-md-left d-md-none">
						Email Users
					</h3>
					<div className="col-12 email-all">
						<div className="row form-group">
							<label
								htmlFor="emailTemplate"
								className="col-12 col-md-2 col-form-label"
							>
								Template
							</label>
							<div className="col-12 col-md-10">
								<select
									className="form-control"
									id="emailTemplate"
									name="emailTemplate"
									value={emailTemplate}
									onChange={_updateEmailTemplate}
								>
									<option value="">-- Select Template --</option>
									{templates.map(({ template, description }) => (
										<option value={template} key={template}>
											{description}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="row form-group">
							<label
								htmlFor="emailGroup"
								className="col-12 col-md-2 col-form-label"
							>
								Add Group
							</label>
							<div className="col-12 col-md-10">
								<div
									className="btn-group"
									role="group"
									aria-label="Filter Users"
									id="emailGroup"
								>
									<button
										type="button"
										className="btn btn-info"
										onClick={(): void => _getMailingList('Registered')}
									>
										Registered
									</button>
									<button
										type="button"
										className="btn btn-info"
										onClick={(): void => _getMailingList('Owe $')}
									>
										Owe $
									</button>
									<button
										type="button"
										className="btn btn-info"
										onClick={(): void => _getMailingList('Rookies')}
									>
										Rookies
									</button>
									<button
										type="button"
										className="btn btn-info"
										onClick={(): void => _getMailingList('Veterans')}
									>
										Veterans
									</button>
									<button
										type="button"
										className="btn btn-info"
										onClick={(): void => _getMailingList('Incomplete')}
									>
										Incomplete
									</button>
									<button
										type="button"
										className="btn btn-info"
										onClick={(): void => _getMailingList('Inactive')}
									>
										Inactive
									</button>
									<button
										type="button"
										className="btn btn-info"
										onClick={(): void => _getMailingList('All')}
									>
										All
									</button>
								</div>
							</div>
						</div>
						<div className="row form-group">
							<label
								htmlFor="emailTo"
								className="col-12 col-md-2 col-form-label"
							>
								Send To
							</label>
							<div className="col-12 col-md-10">
								<textarea
									className="form-control"
									id="emailTo"
									name="emailTo"
									value={emailTo}
									placeholder="Send To (Comma-delimited)"
									onChange={_updateEmailTo}
								/>
							</div>
						</div>
						<div className="row form-group">
							<label
								htmlFor="emailSubject"
								className="col-12 col-md-2 col-form-label"
							>
								Subject
							</label>
							<div className="col-12 col-md-10">
								<input
									type="text"
									className="form-control"
									id="emailSubject"
									name="emailSubject"
									value={emailSubject}
									onChange={_updateEmailSubject}
								/>
							</div>
						</div>
						<div className="row form-group">
							<label
								htmlFor="emailBody"
								className="col-12 col-md-2 col-form-label"
							>
								Message
							</label>
							<div className="col-12 col-md-10">
								<ReactQuill
									id="emailBody"
									theme="snow"
									value={emailBody}
									onChange={setEmailBody}
								/>
							</div>
						</div>
						<div className="row form-group">
							<div className="col-12 col-md-6">
								<button
									type="button"
									className="btn btn-block btn-info"
									id="previewEmail"
									title="Opens in new tab"
									disabled={!emailTemplate}
									onClick={_previewEmail}
								>
									Preview
								</button>
							</div>
							<div className="col-12 col-md-6">
								<button
									type="button"
									className="btn btn-block btn-primary"
									id="sendEmail"
									disabled={!emailBody || !emailTemplate || !emailTo}
									onClick={_sendEmail}
								>
									Send
								</button>
							</div>
						</div>
					</div>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

AdminEmail.whyDidYouRender = true;

export default withTracker<TAdminEmailProps, {}>(
	(): TAdminEmailProps => {
		const allUsersHandle = Meteor.subscribe('adminUsers');
		const allUsersReady = allUsersHandle.ready();
		let users: TUser[] = [];

		if (allUsersReady) users = getAdminUsers.call({});

		return {
			pageReady: allUsersReady,
			users,
		};
	},
)(AdminEmail);
