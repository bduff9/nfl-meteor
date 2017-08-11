'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';

import { EMAIL_SUBJECT_PREFIX } from '../../api/constants';
import { displayError } from '../../api/global';
import { deleteUser, getAdminUsers, updateUserAdmin } from '../../api/collections/users';

class AdminUsers extends Component {
	constructor (props) {
		super();
		this.state = {
			emailBody: '',
			emailModal: false,
			emailSubject: EMAIL_SUBJECT_PREFIX
		};
		this._sendEmail = this._sendEmail.bind(this);
		this._toggleEmail = this._toggleEmail.bind(this);
		this._updateEmailBody = this._updateEmailBody.bind(this);
		this._updateEmailSubject = this._updateEmailSubject.bind(this);
	}

	_approveUser (user, ev) {
		const { _id } = user;
		updateUserAdmin.call({ userId: _id, done_registering: true }, displayError);
	}
	_boolToString (flg) {
		if (flg) return <span className="text-success">Yes</span>;
		return <span className="text-danger">No</span>;
	}
	_deleteUser (user, ev) {
		const { _id } = user;
		deleteUser.call({ userId: _id }, displayError);
	}
	_resetPassword (user, ev) {
		const { email } = user;
		Accounts.forgotPassword({ email }, err => {
			if (err) {
				displayError(err);
			} else {
				Bert.alert({ type: 'success', message: 'Password reset email has been sent' });
			}
		});
	}
	_sendEmail (ev) {
		const { users } = this.props,
				{ emailBody, emailSubject } = this.state;
		const emailList = users.map(user => user.email);
		//TODO: send email using BA's logic
		console.log('BCC email to', emailList);
		console.log('Subject', emailSubject);
		console.log('Body', emailBody);
		this.setState({ emailBody: '', emailModal: false, emailSubject: EMAIL_SUBJECT_PREFIX });
	}
	_toggleAdmin (user, ev) {
		const { _id, is_admin } = user;
		updateUserAdmin.call({ userId: _id, isAdmin: !is_admin }, displayError);
	}
	_toggleEmail (ev) {
		const { emailModal } = this.state;
		this.setState({ emailModal: !emailModal });
	}
	_togglePaid (user, ev) {
		const { _id, paid } = user;
		updateUserAdmin.call({ userId: _id, paid: !paid }, displayError);
	}
	_toggleSurvivor (user, ev) {
		const { _id, survivor } = user;
		updateUserAdmin.call({ userId: _id, survivor: !survivor }, displayError);
	}
	_updateEmailBody (ev) {
		const emailBody = ev.target.value;
		this.setState({ emailBody });
	}
	_updateEmailSubject (ev) {
		const emailSubject = ev.target.value;
		this.setState({ emailSubject });
	}

	render () {
		const { pageReady, users } = this.props,
				{ emailBody, emailModal, emailSubject } = this.state;
		return (
			<div className="row admin-wrapper">
				<Helmet title="User Admin" />
				{pageReady ? (
					<div className="col-xs-12">
						<h3 className="title-text text-xs-center text-md-left hidden-md-up">User Admin</h3>
						<button type="button" className="btn btn-primary" onClick={this._toggleEmail}>
							<i className="fa fa-fw fa-envelope"></i>
							Send Email to All
						</button>
						{emailModal ? (
							<div className="col-xs-12 email-all">
								<div className="row form-group">
									<label htmlFor="emailSubject" className="col-xs-12 col-md-2 col-form-label">Subject</label>
									<div className="col-xs-12 col-md-10">
										<input type="text" className="form-control" id="emailSubject" name="emailSubject" value={emailSubject} onChange={this._updateEmailSubject} />
									</div>
								</div>
								<div className="row form-group">
									<label htmlFor="emailBody" className="col-xs-12 col-md-2 col-form-label">Message</label>
									<div className="col-xs-12 col-md-10">
										<textarea className="form-control" id="emailBody" name="emailBody" value={emailBody} onChange={this._updateEmailBody} />
									</div>
								</div>
								<div>
									<button type="button" className="btn btn-block btn-primary" onClick={this._sendEmail}>Send</button>
								</div>
							</div>
						)
							:
							null
						}
						<table className="table table-hover table-bordered admin-users-table">
							<thead>
								<tr>
									<th colSpan={5}>{`${users.length} Users`}</th>
									<th>Name</th>
									<th>Email</th>
									<th>Team Name</th>
									<th>Referred By</th>
									<th>Verified?</th>
									<th>Finished Registration?</th>
									<th>Admin?</th>
									<th>Paid?</th>
									<th>Survivor?</th>
									<th>Auto Pick</th>
									<th>Logins</th>
								</tr>
							</thead>
							<tbody>
								{users.map(user => (
									<tr key={'user' + user._id}>
										<td><i className={`fa fa-fw fa-money ${user.paid ? 'mark-unpaid' : 'mark-paid'}`} title={`Toggle ${user.first_name} ${user.last_name} paid`} onClick={this._togglePaid.bind(null, user)} /></td>
										<td><i className={`fa fa-fw fa-flag ${user.survivor ? 'survivor' : 'no-survivor'}`} title={`Toggle ${user.first_name} ${user.last_name} survivor game`} onClick={this._toggleSurvivor.bind(null, user)} /></td>
										<td><i className={`fa fa-fw fa-user-secret ${user.is_admin ? 'is-admin' : 'not-admin'}`} title={`Toggle ${user.first_name} ${user.last_name} as admin`} onClick={this._toggleAdmin.bind(null, user)} /></td>
										<td><i className="fa fa-fw fa-envelope text-warning" title={`Reset ${user.first_name} ${user.last_name}'s password'`} onClick={this._resetPassword.bind(null, user)} /></td>
										<td>
											{!user.done_registering && user.trusted === false ? <i className="fa fa-fw fa-thumbs-up text-success" title={`Approve ${user.first_name} ${user.last_name}`} onClick={this._approveUser.bind(null, user)} /> : null}
											{!user.done_registering ? <i className="fa fa-fw fa-thumbs-down text-danger" title={`Delete ${user.first_name} ${user.last_name}`} onClick={this._deleteUser.bind(null, user)} /> : null}
										</td>
										<td>{`${user.first_name} ${user.last_name}`}</td>
										<td>{user.email}</td>
										<td>{user.team_name}</td>
										<td>{user.referred_by === 'RETURNING PLAYER' ? 'N/A' : user.referred_by}</td>
										<td>{this._boolToString(user.verified)}</td>
										<td>{this._boolToString(user.done_registering)}</td>
										<td>{this._boolToString(user.is_admin)}</td>
										<td>{this._boolToString(user.paid)}</td>
										<td>{this._boolToString(user.survivor)}</td>
										<td title={user.auto_pick_strategy || 'Off'}>{user.auto_pick_count}</td>
										<td style={{ whiteSpace: 'nowrap' }}>
											{user.services.facebook ? <i className="fa fa-fw fa-facebook text-primary"></i> : null}
											{user.services.google ? <i className="fa fa-fw fa-google text-danger"></i> : null}
											{user.services.password ? <i className="fa fa-fw fa-lock text-warning"></i> : null}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)
					:
					null
				}
			</div>
		);
	}
}

AdminUsers.propTypes = {
	pageReady: PropTypes.bool.isRequired,
	users: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default createContainer(() => {
	const allUsersHandle = Meteor.subscribe('adminUsers'),
			allUsersReady = allUsersHandle.ready();
	let users = [];
	if (allUsersReady) users = getAdminUsers.call({});
	return {
		pageReady: allUsersReady,
		users
	};
}, AdminUsers);
