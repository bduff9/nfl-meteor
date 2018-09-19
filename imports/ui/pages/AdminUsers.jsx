'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import sweetAlert from 'sweetalert';

import { handleError } from '../../api/global';
import { deleteUser, getAdminUsers, updateUserAdmin, resetUser } from '../../api/collections/users';

class AdminUsers extends Component {
	constructor (props) {
		super(props);

		this.state = {
			show: 'Registered',
		};
	}

	_approveUser ({ _id: userId }, ev) {
		updateUserAdmin.call({ userId, done_registering: true }, handleError);
	}
	_deleteUser ({ _id: userId }, ev) {
		deleteUser.call({ userId }, handleError);
	}
	_getUserStatus ({ done_registering, trusted, verified }) {
		if (!verified) return <span className="text-danger">Unverified</span>;

		if (!trusted) return <span className="text-warning">Untrusted</span>;

		if (!done_registering) return <span className="text-warning">Verified</span>;

		return <span className="text-success">Registered</span>;
	}
	_removeUser ({ _id: userId }, ev) {
		resetUser.call({ userId, isDropOut: true }, handleError);
	}
	_resetPassword ({ email }, ev) {
		Accounts.forgotPassword({ email }, err => {
			if (err) {
				handleError(err);
			} else {
				Bert.alert({ type: 'success', message: 'Password reset email has been sent' });
			}
		});
	}
	_toggleAdmin ({ _id, is_admin }, ev) {
		updateUserAdmin.call({ userId: _id, isAdmin: !is_admin }, handleError);
	}
	_togglePaid ({ _id, owe, paid, survivor }, ev) {
		const maxPaid = owe;

		sweetAlert({
			title: `How much did they pay? ($${paid})`,
			type: 'input',
			inputType: 'number',
			inputValue: owe - paid,
			showCancelButton: true,
			closeOnConfirm: false,
		}, value => {
			let amount;
			let newValue;

			if (value === false) return false;

			amount = parseInt(value, 10);
			newValue = paid + amount;

			if (value === '' || isNaN(amount)) {
				sweetAlert.showInputError(`Please enter a valid integer (${value})`);

				return false;
			} else if (amount === 0) {
				sweetAlert.showInputError('Please enter a value greater than 0');

				return false;
			} else if (newValue < 0) {
				sweetAlert.showInputError(`New value must be 0 or greater (${newValue})`);

				return false;
			} else if (newValue > maxPaid) {
				sweetAlert.showInputError(`New value must be ${maxPaid} or less (${newValue})`);

				return false;
			}

			updateUserAdmin.call({ userId: _id, paid: newValue }, err => {
				if (err) {
					handleError(err);
				} else {
					sweetAlert.close();
				}
			});
		});
	}
	_toggleSurvivor ({ _id, survivor }, ev) {
		updateUserAdmin.call({ userId: _id, survivor: !survivor }, handleError);
	}

	render () {
		const { pageReady, users } = this.props;
		const { show } = this.state;
		const shown = users && users.filter(user => {
			switch (show) {
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
					console.error('Invalid filter passed', show);

					return false;
			}
		});

		return (
			<div className="row admin-wrapper">
				<Helmet title="User Admin" />
				{pageReady ? (
					<div className="col-xs-12">
						<h3 className="title-text text-xs-center text-md-left hidden-md-up">User Admin</h3>
						&nbsp; &nbsp;Filter:&nbsp;
						<div className="btn-group" role="group" aria-label="Filter Users">
							<button type="button" className="btn btn-info" disabled={show === 'Registered'} onClick={() => this.setState({ show: 'Registered' })}>Registered</button>
							<button type="button" className="btn btn-info" disabled={show === 'Owe $'} onClick={() => this.setState({ show: 'Owe $' })}>Owe $</button>
							<button type="button" className="btn btn-info" disabled={show === 'Rookies'} onClick={() => this.setState({ show: 'Rookies' })}>Rookies</button>
							<button type="button" className="btn btn-info" disabled={show === 'Veterans'} onClick={() => this.setState({ show: 'Veterans' })}>Veterans</button>
							<button type="button" className="btn btn-info" disabled={show === 'Incomplete'} onClick={() => this.setState({ show: 'Incomplete' })}>Incomplete</button>
							<button type="button" className="btn btn-info" disabled={show === 'Inactive'} onClick={() => this.setState({ show: 'Inactive' })}>Inactive</button>
							<button type="button" className="btn btn-info" disabled={show === 'All'} onClick={() => this.setState({ show: 'All' })}>All</button>
						</div>
						<table className="table table-hover table-bordered admin-users-table">
							<thead>
								<tr>
									<th colSpan={5}>{`${shown.length} ${shown.length === 1 ? 'User' : 'Users'}`}</th>
									<th>Name</th>
									<th>Email</th>
									<th>Team Name</th>
									<th>Referred By</th>
									<th>Status</th>
									<th>Notifications</th>
									<th>Auto Pick?</th>
									<th>Login</th>
								</tr>
							</thead>
							<tbody>
								{shown.map(user => (
									<tr key={'user' + user._id}>
										<td>
											<i className={`fa fa-fw fa-money ${user.paid === 0 ? 'mark-paid' : (user.paid === user.owe ? 'mark-unpaid' : 'text-warning')}`} title={`${user.first_name} ${user.last_name} has paid $${user.paid} / $${user.owe}`} onClick={this._togglePaid.bind(null, user)} />
										</td>
										<td>
											<i className={`fa fa-fw fa-flag ${user.survivor ? 'survivor' : 'no-survivor'}`} title={`Toggle ${user.first_name} ${user.last_name} survivor game`} onClick={this._toggleSurvivor.bind(null, user)} />
										</td>
										<td>
											<i className={`fa fa-fw fa-user-secret ${user.is_admin ? 'is-admin' : 'not-admin'}`} title={`Toggle ${user.first_name} ${user.last_name} as admin`} onClick={this._toggleAdmin.bind(null, user)} />
										</td>
										<td>
											{user.services.password ?
												<i className="fa fa-fw fa-envelope text-warning" title={`Reset ${user.first_name} ${user.last_name}'s password`} onClick={this._resetPassword.bind(null, user)} />
												:
												null
											}
										</td>
										<td>
											{user.paid === user.owe ?
												null
												:
												user.trusted === false ?
													<span>
														<i className="fa fa-fw fa-thumbs-up text-success" title={`Approve ${user.first_name} ${user.last_name}`} onClick={this._approveUser.bind(null, user)} />
														<i className="fa fa-fw fa-thumbs-down text-danger" title={`Delete ${user.first_name} ${user.last_name}`} onClick={this._deleteUser.bind(null, user)} />
													</span>
													:
													user.years_played && user.years_played.length === 1 ?
														<i className="fa fa-fw fa-thumbs-down text-danger" title={`Delete ${user.first_name} ${user.last_name}`} onClick={this._deleteUser.bind(null, user)} />
														:
														<i className="fa fa-fw fa-sign-out text-danger" title={`Drop out ${user.first_name} ${user.last_name} for current season`} onClick={this._removeUser.bind(null, user)} />
											}
										</td>
										<td title={user.years_played && user.years_played.length ? `Years played ${user.years_played.join(', ')}` : 'Never played previously'}>{`${user.first_name} ${user.last_name}`}</td>
										<td>{user.email}</td>
										<td>{user.team_name}</td>
										<td>{user.referred_by === 'RETURNING PLAYER' ? 'N/A' : user.referred_by}</td>
										<td>{this._getUserStatus(user)}</td>
										<td>{JSON.stringify(user.notifications)}</td>
										<td>{user.auto_pick_strategy || 'Off'}:&nbsp;{user.auto_pick_count}</td>
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
}, AdminUsers);
