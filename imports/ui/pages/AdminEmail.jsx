'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';
import { Bert } from 'meteor/themeteorchef:bert';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';

import { EMAIL_SUBJECT_PREFIX } from '../../api/constants';
import { handleError } from '../../api/global';
import { getAdminUsers } from '../../api/collections/users';

class AdminEmail extends Component {
	constructor (props) {
		super(props);

		this.state = {
			emailBody: '',
			emailSubject: EMAIL_SUBJECT_PREFIX,
			emailTemplate: '',
			emailTo: '',
			templates: [],
		};

		this._getMailingList = this._getMailingList.bind(this);
		this._previewEmail = this._previewEmail.bind(this);
		this._sendEmail = this._sendEmail.bind(this);
		this._updateEmailBody = this._updateEmailBody.bind(this);
		this._updateEmailSubject = this._updateEmailSubject.bind(this);
		this._updateEmailTemplate = this._updateEmailTemplate.bind(this);
		this._updateEmailTo = this._updateEmailTo.bind(this);
	}

	componentWillMount () {
		Meteor.call('Email.getEmailTemplatesForAdminScreen', {}, (error, templates) => {
			this.setState({ templates });
		});
	}

	_getMailingList (type) {
		const { users } = this.props;
		let mailingList = '';

		if (users) {
			const filteredUsers = users.filter(user => {
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
						return user.trusted && !user.done_registering;
					case 'All':
						return true;
					default:
						console.error('Invalid filter passed', type);

						return false;
				}
			});

			mailingList = filteredUsers.map(user => user.email).join(',');
		}

		this.setState({ emailTo: mailingList });
	}
	_previewEmail () {
		const { emailBody, emailTemplate } = this.state;

		Meteor.call('Email.getEmailTemplateObject', { template: emailTemplate }, (error, templateObj) => {
			const templatePath = templateObj.route.path;
			const field = templateObj.adminScreen.emailBody;
			let url = `/emails/preview${templatePath}`;

			if (field) url += `?${field}=${emailBody}`;

			//TODO: can we bring in actual template and show what the email will look like on the same page?  Looks possible with Mailer.precompile (returns a blaze template) or Mailer.render (returns HTML string).  Would need to set up server method to accept template and/or data and then display it on screen somewhere
			window.open(url, '_preview_email');
		});
	}
	_sendEmail (ev) {
		const { emailBody, emailSubject, emailTemplate, emailTo } = this.state;
		const subject = emailSubject.replace(EMAIL_SUBJECT_PREFIX, '');
		const bcc = emailTo.split(',');


		Meteor.call('Email.sendEmail', { bcc, data: { message: emailBody, preview: 'Here is your official weekly email from the NFL Confidence Pool commissioners' }, subject, template: emailTemplate }, err => {
			if (err) {
				handleError(err);
			} else {
				Bert.alert({ type: 'success', message: 'Email has been successfully sent!' });
				this.setState({ emailBody: '', emailSubject: EMAIL_SUBJECT_PREFIX, emailTo: '' });
			}
		});
	}
	_updateEmailBody (emailBody) {
		this.setState({ emailBody });
	}
	_updateEmailSubject (ev) {
		const emailSubject = ev.target.value;

		this.setState({ emailSubject });
	}
	_updateEmailTemplate (ev) {
		const emailTemplate = ev.target.value;

		this.setState({ emailTemplate });
	}
	_updateEmailTo (ev) {
		const emailTo = ev.target.value;

		this.setState({ emailTo });
	}

	render () {
		const { pageReady } = this.props;
		const { emailBody, emailSubject, emailTemplate, emailTo, templates } = this.state;

		return (
			<div className="row admin-wrapper admin-email-wrapper">
				<Helmet title="Email Users" />
				{pageReady ? (
					<div className="col-xs-12">
						<h3 className="title-text text-xs-center text-md-left hidden-md-up">Email Users</h3>
						<div className="col-xs-12 email-all">
							<div className="row form-group">
								<label htmlFor="emailTemplate" className="col-xs-12 col-md-2 col-form-label">Template</label>
								<div className="col-xs-12 col-md-10">
									<select className="form-control" id="emailTemplate" name="emailTemplate" value={emailTemplate} onChange={this._updateEmailTemplate}>
										<option value="">-- Select Template --</option>
										{templates.map(({ template, description }) => <option value={template} key={template}>{description}</option>)}
									</select>
								</div>
							</div>
							<div className="row form-group">
								<label htmlFor="emailGroup" className="col-xs-12 col-md-2 col-form-label">Add Group</label>
								<div className="col-xs-12 col-md-10">
									<div className="btn-group" role="group" aria-label="Filter Users" id="emailGroup">
										<button type="button" className="btn btn-info" onClick={() => this._getMailingList('Registered')}>Registered</button>
										<button type="button" className="btn btn-info" onClick={() => this._getMailingList('Owe $')}>Owe $</button>
										<button type="button" className="btn btn-info" onClick={() => this._getMailingList('Rookies')}>Rookies</button>
										<button type="button" className="btn btn-info" onClick={() => this._getMailingList('Veterans')}>Veterans</button>
										<button type="button" className="btn btn-info" onClick={() => this._getMailingList('Incomplete')}>Incomplete</button>
										<button type="button" className="btn btn-info" onClick={() => this._getMailingList('Inactive')}>Inactive</button>
										<button type="button" className="btn btn-info" onClick={() => this._getMailingList('All')}>All</button>
									</div>
								</div>
							</div>
							<div className="row form-group">
								<label htmlFor="emailTo" className="col-xs-12 col-md-2 col-form-label">Send To</label>
								<div className="col-xs-12 col-md-10">
									<textarea className="form-control" id="emailTo" name="emailTo" value={emailTo} placeholder="Send To (Comma-delimited)" onInput={this._updateEmailTo}></textarea>
								</div>
							</div>
							<div className="row form-group">
								<label htmlFor="emailSubject" className="col-xs-12 col-md-2 col-form-label">Subject</label>
								<div className="col-xs-12 col-md-10">
									<input type="text" className="form-control" id="emailSubject" name="emailSubject" value={emailSubject} onChange={this._updateEmailSubject} />
								</div>
							</div>
							<div className="row form-group">
								<label htmlFor="emailBody" className="col-xs-12 col-md-2 col-form-label">Message</label>
								<div className="col-xs-12 col-md-10">
									<ReactQuill id="emailBody" theme="snow" value={emailBody} onChange={this._updateEmailBody} />
								</div>
							</div>
							<div className="row form-group">
								<div className="col-xs-12 col-md-6">
									<button type="button" className="btn btn-block btn-info" id="previewEmail" title="Opens in new tab" disabled={!emailTemplate} onClick={this._previewEmail}>Preview</button>
								</div>
								<div className="col-xs-12 col-md-6">
									<button type="button" className="btn btn-block btn-primary" id="sendEmail" disabled={!emailBody || !emailTemplate || !emailTo} onClick={this._sendEmail}>Send</button>
								</div>
							</div>
						</div>
					</div>
				)
					:
					null
				}
			</div>
		);
	}
}

AdminEmail.propTypes = {
	pageReady: PropTypes.bool.isRequired,
	users: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default createContainer(() => {
	const allUsersHandle = Meteor.subscribe('adminUsers');
	const allUsersReady = allUsersHandle.ready();
	let users = [];

	if (allUsersReady) users = getAdminUsers.call({});

	return {
		pageReady: allUsersReady,
		users,
	};
}, AdminEmail);
