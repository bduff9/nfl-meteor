import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC, useState } from 'react';
import Helmet from 'react-helmet';
import sweetAlert from 'sweetalert';

import {
	deleteUser,
	getAdminUsers,
	updateUserAdmin,
	resetUser,
	TUser,
} from '../../api/collections/users';
import { TError } from '../../api/commonTypes';
import { handleError } from '../../api/global';

import Loading from './Loading';

export type TAdminFilter =
	| 'All'
	| 'Inactive'
	| 'Incomplete'
	| 'Owe $'
	| 'Registered'
	| 'Rookies'
	| 'Veterans';
export type TAdminUsersProps = {
	pageReady: boolean;
	users: TUser[];
};

const AdminUsers: FC<TAdminUsersProps> = ({
	pageReady,
	users,
}): JSX.Element => {
	const [show, setShow] = useState<TAdminFilter>('Registered');

	const _approveUser = ({ _id: userId }: TUser): void => {
		// eslint-disable-next-line @typescript-eslint/camelcase
		updateUserAdmin.call({ userId, done_registering: true }, handleError);
	};

	const _deleteUser = ({ _id: userId }: TUser): void => {
		deleteUser.call({ userId }, handleError);
	};

	const _getUserStatus = ({
		// eslint-disable-next-line @typescript-eslint/camelcase
		done_registering,
		trusted,
		verified,
	}: TUser): JSX.Element => {
		if (!verified) return <span className="text-danger">Unverified</span>;

		if (!trusted) return <span className="text-warning">Untrusted</span>;

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!done_registering)
			return <span className="text-warning">Verified</span>;

		return <span className="text-success">Registered</span>;
	};

	const _removeUser = ({ _id: userId }: TUser): void => {
		resetUser.call({ userId, isDropOut: true }, handleError);
	};

	const _resetPassword = ({ email }: TUser): void => {
		Accounts.forgotPassword(
			{ email },
			(err: TError): void => {
				if (err) {
					handleError(err);
				} else {
					Bert.alert({
						icon: 'fas fa-check',
						message: 'Password reset email has been sent',
						type: 'success',
					});
				}
			},
		);
	};

	// eslint-disable-next-line @typescript-eslint/camelcase
	const _toggleAdmin = ({ _id, is_admin }: TUser): void => {
		// eslint-disable-next-line @typescript-eslint/camelcase
		updateUserAdmin.call({ userId: _id, isAdmin: !is_admin }, handleError);
	};

	const _togglePaid = ({ _id, owe, paid }: TUser): void => {
		const maxPaid = owe;

		sweetAlert({
			title: `How much did they pay? ($${paid} / $${owe})`,
			content: {
				element: 'input',
				attributes: {
					placeholder: 'Enter paid amount',
					type: 'number',
					value: '',
				},
			},
			buttons: {
				cancel: true,
				confirm: {
					closeModal: false,
				},
			},
		}).then(
			(value: false | string): false | void => {
				if (value === false) return false;

				const amount = parseInt(value, 10);
				const newValue = paid + amount;

				if (value === '' || isNaN(amount)) {
					alert(`Please enter a valid integer (${value})`);

					if (sweetAlert.stopLoading) sweetAlert.stopLoading();

					return false;
				} else if (amount === 0) {
					alert('Please enter a value greater than 0');

					if (sweetAlert.stopLoading) sweetAlert.stopLoading();

					return false;
				} else if (newValue < 0) {
					alert(`New value must be 0 or greater (${newValue})`);

					if (sweetAlert.stopLoading) sweetAlert.stopLoading();

					return false;
				} else if (newValue > maxPaid) {
					alert(`New value must be ${maxPaid} or less (${newValue})`);

					if (sweetAlert.stopLoading) sweetAlert.stopLoading();

					return false;
				}

				updateUserAdmin.call(
					{ userId: _id, paid: newValue },
					(err: TError): void => {
						if (err) {
							handleError(err);
						} else {
							if (sweetAlert.close) sweetAlert.close();
						}
					},
				);
			},
		);
	};

	const _toggleSurvivor = ({ _id, survivor }: TUser): void => {
		updateUserAdmin.call({ userId: _id, survivor: !survivor }, handleError);
	};

	const shown =
		users &&
		users.filter(
			(user): boolean => {
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
						return !!user.trusted && !user.done_registering;
					case 'All':
						return true;
					default:
						console.error('Invalid filter passed', show);

						return false;
				}
			},
		);

	return (
		<div className="row admin-wrapper">
			<Helmet title="User Admin" />
			{pageReady ? (
				<div className="col-12">
					<h3 className="title-text text-center d-md-none">User Admin</h3>
					&nbsp; &nbsp;Filter:&nbsp;
					<div className="btn-group" role="group" aria-label="Filter Users">
						<button
							type="button"
							className="btn btn-info"
							disabled={show === 'Registered'}
							onClick={(): void => setShow('Registered')}
						>
							Registered
						</button>
						<button
							type="button"
							className="btn btn-info"
							disabled={show === 'Owe $'}
							onClick={(): void => setShow('Owe $')}
						>
							Owe $
						</button>
						<button
							type="button"
							className="btn btn-info"
							disabled={show === 'Rookies'}
							onClick={(): void => setShow('Rookies')}
						>
							Rookies
						</button>
						<button
							type="button"
							className="btn btn-info"
							disabled={show === 'Veterans'}
							onClick={(): void => setShow('Veterans')}
						>
							Veterans
						</button>
						<button
							type="button"
							className="btn btn-info"
							disabled={show === 'Incomplete'}
							onClick={(): void => setShow('Incomplete')}
						>
							Incomplete
						</button>
						<button
							type="button"
							className="btn btn-info"
							disabled={show === 'Inactive'}
							onClick={(): void => setShow('Inactive')}
						>
							Inactive
						</button>
						<button
							type="button"
							className="btn btn-info"
							disabled={show === 'All'}
							onClick={(): void => setShow('All')}
						>
							All
						</button>
					</div>
					<table className="table table-hover table-bordered admin-users-table">
						<thead>
							<tr>
								<th colSpan={5}>{`${shown.length} ${
									shown.length === 1 ? 'User' : 'Users'
								}`}</th>
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
							{shown.map(
								(user): JSX.Element => (
									<tr key={`user-to-admin-${user._id}`}>
										<td
											title={`${user.first_name} ${user.last_name} has paid $${
												user.paid
											} / $${user.owe}`}
										>
											<span onClick={(): void => _togglePaid(user)}>
												<FontAwesomeIcon
													className={
														user.paid === 0
															? 'mark-paid'
															: user.paid === user.owe
																? 'mark-unpaid'
																: 'text-warning'
													}
													icon={['fad', 'money-bill']}
													fixedWidth
												/>
											</span>
										</td>
										<td
											title={`Toggle ${user.first_name} ${
												user.last_name
											} survivor game`}
										>
											<span onClick={(): void => _toggleSurvivor(user)}>
												<FontAwesomeIcon
													className={user.survivor ? 'survivor' : 'no-survivor'}
													icon={['fad', 'flag']}
													fixedWidth
												/>
											</span>
										</td>
										<td
											title={`Toggle ${user.first_name} ${
												user.last_name
											} as admin`}
										>
											<span onClick={(): void => _toggleAdmin(user)}>
												<FontAwesomeIcon
													className={user.is_admin ? 'is-admin' : 'not-admin'}
													icon={['fad', 'user-secret']}
													fixedWidth
												/>
											</span>
										</td>
										<td
											title={`Reset ${user.first_name} ${
												user.last_name
											}'s password`}
										>
											{user.services.password && (
												<span onClick={(): void => _resetPassword(user)}>
													<FontAwesomeIcon
														className="text-warning"
														icon={['fad', 'envelope']}
														fixedWidth
													/>
												</span>
											)}
										</td>
										<td>
											{user.paid === user.owe ? null : user.trusted ===
											false ? (
												<>
													<span
														title={`Approve ${user.first_name} ${
															user.last_name
														}`}
														onClick={(): void => _approveUser(user)}
													>
														<FontAwesomeIcon
															className="text-success"
															icon={['fad', 'thumbs-up']}
															fixedWidth
														/>
													</span>
													<span
														title={`Delete ${user.first_name} ${
															user.last_name
														}`}
														onClick={(): void => _deleteUser(user)}
													>
														<FontAwesomeIcon
															className="text-danger"
															icon={['fad', 'thumbs-down']}
															fixedWidth
														/>
													</span>
												</>
											) : user.years_played && user.years_played.length < 2 ? (
												<span
													title={`Delete ${user.first_name} ${user.last_name}`}
													onClick={(): void => _deleteUser(user)}
												>
													<FontAwesomeIcon
														className="text-danger"
														icon={['fad', 'thumbs-down']}
														fixedWidth
													/>
												</span>
											) : (
												<span
													title={`Drop out ${user.first_name} ${
														user.last_name
													} for current season`}
													onClick={(): void => _removeUser(user)}
												>
													<FontAwesomeIcon
														className="text-danger"
														icon={['fad', 'sign-out']}
														fixedWidth
													/>
												</span>
											)}
										</td>
										<td
											title={
												user.years_played && user.years_played.length
													? `Years played ${user.years_played.join(', ')}`
													: 'Never played previously'
											}
										>{`${user.first_name} ${user.last_name}`}</td>
										<td>{user.email}</td>
										<td>{user.team_name}</td>
										<td>
											{user.referred_by === 'RETURNING PLAYER'
												? 'N/A'
												: user.referred_by}
										</td>
										<td>{_getUserStatus(user)}</td>
										<td>{JSON.stringify(user.notifications)}</td>
										<td>
											{user.auto_pick_strategy || 'Off'}:&nbsp;
											{user.auto_pick_count}
										</td>
										<td style={{ whiteSpace: 'nowrap' }}>
											{user.services.facebook && (
												<FontAwesomeIcon
													className="text-primary"
													icon={['fab', 'facebook']}
													fixedWidth
												/>
											)}
											{user.services.google && (
												<FontAwesomeIcon
													className="text-danger"
													icon={['fab', 'google']}
													fixedWidth
												/>
											)}
											{user.services.password && (
												<FontAwesomeIcon
													className="text-warning"
													icon={['fad', 'lock']}
													fixedWidth
												/>
											)}
										</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

AdminUsers.whyDidYouRender = true;

export default withTracker<TAdminUsersProps, {}>(
	(): TAdminUsersProps => {
		const allUsersHandle = Meteor.subscribe('adminUsers');
		const allUsersReady = allUsersHandle.ready();
		let users: TUser[] = [];

		if (allUsersReady) users = getAdminUsers.call({});

		return {
			pageReady: allUsersReady,
			users,
		};
	},
)(AdminUsers);
