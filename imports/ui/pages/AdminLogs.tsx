import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Counts } from 'meteor/tmeasday:publish-counts';
import React, { FC, useEffect, useState, MouseEvent } from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';

import { getLogs, TNFLLog } from '../../api/collections/nfllogs';
import { getUsersForLogs, TUser } from '../../api/collections/users';
import { TNFLLogAction } from '../../api/commonTypes';
import { ACTIONS } from '../../api/constants';
import { formatDate, handleError } from '../../api/global';

import Loading from './Loading';

export type TAdminLogsProps = RouteComponentProps & {
	actions: TNFLLogAction[] | null;
	limit: number;
	logCt: number;
	logs: TNFLLog[];
	page: number;
	pageReady: boolean;
	pathname: string;
	userFroms: string[] | null;
	users: TUser[];
	userTos: string[] | null;
};
export type TAdminLogsFilter = {
	action?: { $in: TNFLLogAction[] };
	to_id?: { $in: string[] };
	user_id?: { $in: string[] };
};

const AdminLogs: FC<TAdminLogsProps> = ({
	actions,
	history,
	limit,
	logCt,
	logs,
	page,
	pageReady,
	pathname,
	userFroms,
	users,
	userTos,
}): JSX.Element => {
	const [totalPages, setTotalPages] = useState<number>(
		Math.ceil(logCt / limit),
	);
	const hasPrev = page > 1;
	const hasNext = page * limit < logCt;

	const _redirect = (
		pathname: string,
		limit: number,
		page: number,
		actions: TNFLLogAction[] | null,
		userFroms: string[] | null,
		userTos: string[] | null,
	): void => {
		const limitChanged = limit !== 10;
		const pageChanged = page > 1;
		const actionChanged = actions && actions.length > 0;
		const userChanged = userFroms && userFroms.length > 0;
		const userToChanged = userTos && userTos.length > 0;
		let newPath = pathname;

		if (limitChanged)
			newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}limit=${limit}`;

		if (pageChanged)
			newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}page=${page}`;

		if (actionChanged)
			newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}actions=${actions}`;

		if (userChanged)
			newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}users=${userFroms}`;

		if (userToChanged)
			newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}userTos=${userTos}`;

		history.push(newPath);
	};

	useEffect((): void => {
		if (pageReady) {
			const newTotal = Math.ceil(logCt / limit);

			if (newTotal > 0 && page > newTotal) {
				_redirect(pathname, limit, newTotal, actions, userFroms, userTos);
			} else if (newTotal !== totalPages) {
				setTotalPages(newTotal);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		actions,
		limit,
		logCt,
		page,
		pageReady,
		pathname,
		totalPages,
		userFroms,
		userTos,
	]);

	const _changePage = (
		dir: number,
		disabled: boolean,
		ev: MouseEvent,
	): false => {
		const newPage = page + dir;

		ev.preventDefault();

		if (!disabled)
			_redirect(pathname, limit, newPage, actions, userFroms, userTos);

		return false;
	};

	const _filterAction = (
		action: TNFLLogAction,
		add: boolean,
		ev: MouseEvent,
	): false => {
		let newActions;

		ev.preventDefault();

		if (add) {
			newActions = Object.assign([], actions);
			newActions.push(action);
		} else {
			newActions = actions && actions.filter(a => a !== action);
		}

		_redirect(pathname, limit, 1, newActions, userFroms, userTos);

		return false;
	};

	const _filterUser = (userId: string, add: boolean, ev: MouseEvent): false => {
		let newUsers;

		ev.preventDefault();

		if (add) {
			newUsers = Object.assign([], userFroms);
			newUsers.push(userId);
		} else {
			newUsers = userFroms && userFroms.filter(u => u !== userId);
		}

		_redirect(pathname, limit, 1, actions, newUsers, userTos);

		return false;
	};

	const _filterUserTos = (
		userId: string,
		add: boolean,
		ev: MouseEvent,
	): false => {
		let newUsers;

		ev.preventDefault();

		if (add) {
			newUsers = Object.assign([], userTos);
			newUsers.push(userId);
		} else {
			newUsers = userTos && userTos.filter(u => u !== userId);
		}

		_redirect(pathname, limit, 1, actions, userFroms, newUsers);

		return false;
	};

	return (
		<div className="row admin-logs">
			<Helmet title="View All Logs" />
			<h3 className="title-text text-center col-12 d-md-none">View All Logs</h3>
			<nav className="text-center col-12">
				<ul className="pagination">
					<li className={'page-item' + (!hasPrev ? ' disabled' : '')}>
						<a
							className="page-link"
							href="#"
							aria-label="First"
							onClick={(ev): false => _changePage(1 - page, !hasPrev, ev)}
						>
							<FontAwesomeIcon icon={['fad', 'angle-double-left']} fixedWidth />
							<span className="sr-only">First Page</span>
						</a>
					</li>
					<li className={'page-item' + (!hasPrev ? ' disabled' : '')}>
						<a
							className="page-link"
							href="#"
							aria-label="Previous"
							onClick={(ev): false => _changePage(-1, !hasPrev, ev)}
						>
							<FontAwesomeIcon icon={['fad', 'angle-left']} fixedWidth />
							<span className="sr-only">Previous</span>
						</a>
					</li>
					<li className="page-item disabled">
						<a className="page-link" href="#">
							Page {totalPages === 0 ? 0 : page} of {totalPages}
						</a>
					</li>
					<li className={'page-item' + (!hasNext ? ' disabled' : '')}>
						<a
							className="page-link"
							href="#"
							aria-label="Next"
							onClick={(ev): false => _changePage(1, !hasNext, ev)}
						>
							<FontAwesomeIcon icon={['fad', 'angle-right']} fixedWidth />
							<span className="sr-only">Next</span>
						</a>
					</li>
					<li className={'page-item' + (!hasNext ? ' disabled' : '')}>
						<a
							className="page-link"
							href="#"
							aria-label="Next"
							onClick={(ev): false =>
								_changePage(totalPages - page, !hasNext, ev)
							}
						>
							<FontAwesomeIcon
								icon={['fad', 'angle-double-right']}
								fixedWidth
							/>
							<span className="sr-only">Last Page</span>
						</a>
					</li>
				</ul>
			</nav>
			{pageReady ? (
				<div className="col-12">
					<table className="table table-hover table-bordered admin-logs-table">
						<thead>
							<tr>
								<th>
									<div className="dropdown filter">
										<button
											className="btn dropdown-toggle"
											type="button"
											id="action-filter"
											data-toggle="dropdown"
											aria-haspopup="true"
											aria-expanded="false"
										>
											Action
										</button>
										<div
											className="dropdown-menu"
											aria-labelledby="action-filter"
										>
											{ACTIONS.map((action, i) => {
												const selected =
													actions && actions.indexOf(action) > -1;

												return (
													<a
														className="dropdown-item"
														href="#"
														onClick={(ev): false =>
															_filterAction(action, !selected, ev)
														}
														key={`action-${i}`}
													>
														{selected && (
															<FontAwesomeIcon
																icon={['fad', 'check']}
																fixedWidth
															/>
														)}
														{action}
													</a>
												);
											})}
										</div>
									</div>
								</th>
								<th>Time</th>
								<th>Message</th>
								<th>
									<div className="dropdown filter">
										<button
											className="btn dropdown-toggle"
											type="button"
											id="user-filter"
											data-toggle="dropdown"
											aria-haspopup="true"
											aria-expanded="false"
										>
											User
										</button>
										<div
											className="dropdown-menu"
											aria-labelledby="user-filter"
										>
											{users.map(
												(user): JSX.Element => {
													const selected =
														userFroms && userFroms.indexOf(user._id) > -1;

													return (
														<a
															className="dropdown-item"
															href="#"
															onClick={(ev): false =>
																_filterUser(user._id, !selected, ev)
															}
															key={`user-${user._id}`}
														>
															{selected && (
																<FontAwesomeIcon
																	icon={['fad', 'check']}
																	fixedWidth
																/>
															)}
															{`${user.first_name} ${user.last_name}`}
														</a>
													);
												},
											)}
										</div>
									</div>
								</th>
								<th>Is read?</th>
								<th>Is deleted?</th>
								<th>
									<div className="dropdown filter">
										<button
											className="btn dropdown-toggle"
											type="button"
											id="user-to-filter"
											data-toggle="dropdown"
											aria-haspopup="true"
											aria-expanded="false"
										>
											User To
										</button>
										<div
											className="dropdown-menu"
											aria-labelledby="user-to-filter"
										>
											{users.map(
												(user): JSX.Element => {
													const selected =
														userTos && userTos.indexOf(user._id) > -1;

													return (
														<a
															className="dropdown-item"
															href="#"
															onClick={(ev): false =>
																_filterUserTos(user._id, !selected, ev)
															}
															key={`userTo-${user._id}`}
														>
															{selected && (
																<FontAwesomeIcon
																	icon={['fad', 'check']}
																	fixedWidth
																/>
															)}
															{`${user.first_name} ${user.last_name}`}
														</a>
													);
												},
											)}
										</div>
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							{logs.map(
								(log): JSX.Element => {
									const user = log.getUser();
									const userTo = log.getUserTo();

									return (
										<tr key={`log-${log._id}`}>
											<td>{log.action}</td>
											<td>{formatDate(log.when, true)}</td>
											<td>{log.message}</td>
											<td>{user && `${user.first_name} ${user.last_name}`}</td>
											<td>
												{log.action === 'MESSAGE' && (log.is_read ? 'Y' : 'N')}
											</td>
											<td>
												{log.action === 'MESSAGE' &&
													(log.is_deleted ? 'Y' : 'N')}
											</td>
											<td>
												{log.action === 'MESSAGE' &&
													userTo &&
													`${userTo.first_name} ${userTo.last_name}`}
											</td>
										</tr>
									);
								},
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

AdminLogs.whyDidYouRender = true;

export default withTracker<TAdminLogsProps, RouteComponentProps>(
	({ history, location, match }): TAdminLogsProps => {
		const { pathname, search } = location;
		const searchArr = search.substring(1).split('&');
		const limit = searchArr.reduce((prev, q): number => {
			const parm = q.split('=');

			if (parm[0] === 'limit') return parseInt(parm[1], 10);

			return prev;
		}, 10);
		const page = searchArr.reduce((prev, q): number => {
			const parm = q.split('=');

			if (parm[0] === 'page') return parseInt(parm[1], 10);

			return prev;
		}, 1);
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		const actions: TNFLLogAction[] | null = searchArr.reduce(
			(prev: null | string[], q): null | string[] => {
				const parm = q.split('=');

				if (parm[0] === 'actions') return parm[1].split(',');

				return prev;
			},
			null,
		);
		const userFroms = searchArr.reduce((prev: null | string[], q):
			| null
			| string[] => {
			const parm = q.split('=');

			if (parm[0] === 'users') return parm[1].split(',');

			return prev;
		}, null);
		const userTos = searchArr.reduce((prev: null | string[], q):
			| null
			| string[] => {
			const parm = q.split('=');

			if (parm[0] === 'userTos') return parm[1].split(',');

			return prev;
		}, null);
		const skip = limit * (page - 1);
		const allUsersHandle = Meteor.subscribe('adminUsers');
		const allUsersReady = allUsersHandle.ready();
		const filters: TAdminLogsFilter = {};
		let logs: TNFLLog[] = [];
		let users: TUser[] = [];

		if (actions) filters.action = { $in: actions };

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (userFroms) filters.user_id = { $in: userFroms };

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (userTos) filters.to_id = { $in: userTos };

		const allLogsHandle = Meteor.subscribe('adminLogs', filters, limit, skip);
		const allLogsReady = allLogsHandle.ready();
		const logCt = Counts.get('adminLogsCt');

		if (allLogsReady) logs = getLogs.call({ filters }, handleError);

		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		if (allUsersReady) users = getUsersForLogs.call({}, handleError);

		return {
			actions,
			history,
			limit,
			location,
			logCt,
			logs,
			match,
			page,
			pageReady: allLogsReady && allUsersReady,
			pathname,
			userFroms,
			users,
			userTos,
		};
	},
)(AdminLogs);
