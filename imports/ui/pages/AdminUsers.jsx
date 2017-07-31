'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';

import { displayError } from '../../api/global';
import { deleteUser, getAdminUsers, updateUserAdmin } from '../../api/collections/users';

class AdminUsers extends Component {
	constructor (props) {
		super();
		this.state = {};
	}

	_togglePaid (user, ev) {
		const { paid } = user;
		updateUserAdmin.call({ userId: user._id, paid: !paid }, displayError);
	}
	_toggleSurvivor (user, ev) {
		const { survivor } = user;
		updateUserAdmin.call({ userId: user._id, survivor: !survivor }, displayError);
	}
	_toggleAdmin (user, ev) {
		const { is_admin } = user;
		updateUserAdmin.call({ userId: user._id, isAdmin: !is_admin }, displayError);
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
	_deleteUser (user, ev) {
		const { _id } = user;
		deleteUser.call({ userId: _id }, displayError);
	}
	_boolToString (flg) {
		if (flg) return <span className="text-success">Yes</span>;
		return <span className="text-danger">No</span>;
	}

	render () {
		const { pageReady, users } = this.props;
		return (
			<div className="row admin-wrapper">
				<Helmet title="User Admin" />
				{pageReady ? (
					<div className="col-xs-12">
						<h3 className="title-text text-xs-center text-md-left hidden-md-up">User Admin</h3>
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
											{!user.done_registering ? <i className="fa fa-fw fa-times text-danger" title={`Delete ${user.first_name} ${user.last_name}`} onClick={this._deleteUser.bind(null, user)} /> : null}
										</td>
										<td>{`${user.first_name} ${user.last_name}`}</td>
										<td>{user.email}</td>
										<td>{user.team_name}</td>
										<td>{user.referred_by === 'RETURNING' ? 'N/A' : user.referred_by}</td>
										<td>{this._boolToString(user.verified)}</td>
										<td>{this._boolToString(user.done_registering)}</td>
										<td>{this._boolToString(user.is_admin)}</td>
										<td>{this._boolToString(user.paid)}</td>
										<td>{this._boolToString(user.survivor)}</td>
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
	if (allUsersReady) users = getAdminUsers.call({}, displayError);
	return {
		pageReady: allUsersReady,
		users
	};
}, AdminUsers);
