'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';
import { Counts } from 'meteor/tmeasday:publish-counts';

import { ACTIONS } from '../../api/constants';
import { formatDate, handleError } from '../../api/global';
import { Loading } from './Loading.jsx';
import { getLogs } from '../../api/collections/nfllogs';
import { getUsersForLogs } from '../../api/collections/users';

class AdminLogs extends Component {
	constructor (props) {
		const { limit, logCt } = props;
		super();
		this.state = {
			totalPages: Math.ceil(logCt / limit)
		};
		this._changePage = this._changePage.bind(this);
		this._filterAction = this._filterAction.bind(this);
		this._filterUser = this._filterUser.bind(this);
		this._filterUserTos = this._filterUserTos.bind(this);
		this._redirect = this._redirect.bind(this);
	}

	componentWillReceiveProps (nextProps) {
		const { actions, limit, logCt, page, pageReady, pathname, userFroms, userTos } = nextProps;
		const { totalPages } = this.state;
		let newTotal;
		if (pageReady) {
			newTotal = Math.ceil(logCt / limit);
			if (newTotal > 0 && page > newTotal) {
				this._redirect(pathname, limit, newTotal, actions, userFroms, userTos);
			} else if (newTotal !== totalPages) {
				this.setState({ totalPages: newTotal });
			}
		}
	}

	_changePage (dir, disabled, ev) {
		const { actions, limit, page, pathname, userFroms, userTos } = this.props,
				newPage = page + dir;
		ev.preventDefault();
		if (!disabled) this._redirect(pathname, limit, newPage, actions, userFroms, userTos);
		return false;
	}
	_filterAction (action, add, ev) {
		const { actions, limit, pathname, userFroms, userTos } = this.props;
		let newActions;
		ev.preventDefault();
		if (add) {
			newActions = Object.assign([], actions);
			newActions.push(action);
		} else {
			newActions = actions.filter(a => a !== action);
		}
		this._redirect(pathname, limit, 1, newActions, userFroms, userTos);
		return false;
	}
	_filterUser (userId, add, ev) {
		const { actions, limit, pathname, userFroms, userTos } = this.props;
		let newUsers;
		ev.preventDefault();
		if (add) {
			newUsers = Object.assign([], userFroms);
			newUsers.push(userId);
		} else {
			newUsers = userFroms.filter(u => u !== userId);
		}
		this._redirect(pathname, limit, 1, actions, newUsers, userTos);
		return false;
	}
	_filterUserTos (userId, add, ev) {
		const { actions, limit, pathname, userFroms, userTos } = this.props;
		let newUsers;
		ev.preventDefault();
		if (add) {
			newUsers = Object.assign([], userTos);
			newUsers.push(userId);
		} else {
			newUsers = userTos.filter(u => u !== userId);
		}
		this._redirect(pathname, limit, 1, actions, userFroms, newUsers);
		return false;
	}
	_redirect (pathname, limit, page, actions, userFroms, userTos) {
		const limitChanged = limit !== 10,
				pageChanged = page > 1,
				actionChanged = actions && actions.length > 0,
				userChanged = userFroms && userFroms.length > 0,
				userToChanged = userTos && userTos.length > 0;
		let newPath = pathname;
		if (limitChanged) newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}limit=${limit}`;
		if (pageChanged) newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}page=${page}`;
		if (actionChanged) newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}actions=${actions}`;
		if (userChanged) newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}users=${userFroms}`;
		if (userToChanged) newPath += `${newPath.indexOf('?') === -1 ? '?' : '&'}userTos=${userTos}`;
		this.context.router.push(newPath);
	}

	render () {
		const { totalPages } = this.state,
				{ actions, limit, logCt, logs, page, pageReady, userFroms, users, userTos } = this.props,
				hasPrev = page > 1,
				hasNext = (page * limit) < logCt;
		return (
			<div className="row admin-logs">
				<Helmet title="View All Logs" />
				<h3 className="title-text text-xs-center text-md-left hidden-md-up">View All Logs</h3>
				<nav className="text-xs-center text-md-right">
					<ul className="pagination">
						<li className={'page-item' + (!hasPrev ? ' disabled' : '')}>
							<a className="page-link" href="#" aria-label="First" onClick={this._changePage.bind(null, 1 - page, !hasPrev)}>
								<i className="fa fa-fw fa-angle-double-left" />
								<span className="sr-only">First Page</span>
							</a>
						</li>
						<li className={'page-item' + (!hasPrev ? ' disabled' : '')}>
							<a className="page-link" href="#" aria-label="Previous" onClick={this._changePage.bind(null, -1, !hasPrev)}>
								<i className="fa fa-fw fa-angle-left" />
								<span className="sr-only">Previous</span>
							</a>
						</li>
						<li className="page-item disabled">
							<a className="page-link" href="#">Page {totalPages === 0 ? 0 : page} of {totalPages}</a>
						</li>
						<li className={'page-item' + (!hasNext ? ' disabled' : '')}>
							<a className="page-link" href="#" aria-label="Next" onClick={this._changePage.bind(null, 1, !hasNext)}>
								<i className="fa fa-fw fa-angle-right" />
								<span className="sr-only">Next</span>
							</a>
						</li>
						<li className={'page-item' + (!hasNext ? ' disabled' : '')}>
							<a className="page-link" href="#" aria-label="Next" onClick={this._changePage.bind(null, totalPages - page, !hasNext)}>
								<i className="fa fa-fw fa-angle-double-right" />
								<span className="sr-only">Last Page</span>
							</a>
						</li>
					</ul>
				</nav>
				{pageReady ? (
					<div className="col-xs-12">
						<table className="table table-hover table-bordered admin-logs-table">
							<thead>
								<tr>
									<th>
										<div className="dropdown filter">
											<button className="btn btn-secondary dropdown-toggle" type="button" id="action-filter" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
												Action
											</button>
											<div className="dropdown-menu" aria-labelledby="action-filter">
												{ACTIONS.map((action, i) => {
													const selected = actions && actions.indexOf(action) > -1;
													return (
														<a className="dropdown-item" href="#" onClick={this._filterAction.bind(null, action, !selected)} key={'action' + i}>
															{selected ? <i className="fa fa-fw fa-check" /> : null}
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
											<button className="btn btn-secondary dropdown-toggle" type="button" id="user-filter" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
												User
											</button>
											<div className="dropdown-menu" aria-labelledby="user-filter">
												{users.map(user => {
													const selected = userFroms && userFroms.indexOf(user._id) > -1;
													return (
														<a className="dropdown-item" href="#" onClick={this._filterUser.bind(null, user._id, !selected)} key={'user' + user._id}>
															{selected ? <i className="fa fa-fw fa-check" /> : null}
															{`${user.first_name} ${user.last_name}`}
														</a>
													);
												})}
											</div>
										</div>
									</th>
									<th>Is read?</th>
									<th>Is deleted?</th>
									<th>
										<div className="dropdown filter">
											<button className="btn btn-secondary dropdown-toggle" type="button" id="user-to-filter" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
												User To
											</button>
											<div className="dropdown-menu" aria-labelledby="user-to-filter">
												{users.map(user => {
													const selected = userTos && userTos.indexOf(user._id) > -1;
													return (
														<a className="dropdown-item" href="#" onClick={this._filterUserTos.bind(null, user._id, !selected)} key={'userTo' + user._id}>
															{selected ? <i className="fa fa-fw fa-check" /> : null}
															{`${user.first_name} ${user.last_name}`}
														</a>
													);
												})}
											</div>
										</div>
									</th>
								</tr>
							</thead>
							<tbody>
								{logs.map(log => {
									const user = log.getUser(),
											userTo = log.getUserTo();
									return (
										<tr key={'log' + log._id}>
											<td>{log.action}</td>
											<td>{formatDate(log.when, true)}</td>
											<td>{log.message}</td>
											<td>{user ? `${user.first_name} ${user.last_name}` : ''}</td>
											<td>{log.action === 'MESSAGE' ? (log.is_read ? 'Y' : 'N') : ''}</td>
											<td>{log.action === 'MESSAGE' ? (log.is_deleted ? 'Y' : 'N') : ''}</td>
											<td>{log.action === 'MESSAGE' ? (userTo ? `${userTo.first_name} ${userTo.last_name}` : '') : ''}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)
					:
					<Loading />
				}
			</div>
		);
	}
}

AdminLogs.propTypes = {
	actions: PropTypes.arrayOf(PropTypes.string),
	limit: PropTypes.number.isRequired,
	logCt: PropTypes.number.isRequired,
	logs: PropTypes.arrayOf(PropTypes.object).isRequired,
	page: PropTypes.number.isRequired,
	pageReady: PropTypes.bool.isRequired,
	pathname: PropTypes.string.isRequired,
	userFroms: PropTypes.arrayOf(PropTypes.string),
	users: PropTypes.arrayOf(PropTypes.object).isRequired,
	userTos: PropTypes.arrayOf(PropTypes.string)
};

AdminLogs.contextTypes = {
	router: PropTypes.object.isRequired
};

export default createContainer(({ location }) => {
	const { pathname, search } = location,
			searchArr = search.substring(1).split('&'),
			limit = searchArr.reduce((prev, q) => {
				const parm = q.split('=');
				if (parm[0] === 'limit') return parseInt(parm[1], 10);
				return prev;
			}, 10),
			page = searchArr.reduce((prev, q) => {
				const parm = q.split('=');
				if (parm[0] === 'page') return parseInt(parm[1], 10);
				return prev;
			}, 1),
			actions = searchArr.reduce((prev, q) => {
				const parm = q.split('=');
				if (parm[0] === 'actions') return parm[1].split(',');
				return prev;
			}, null),
			userFroms = searchArr.reduce((prev, q) => {
				const parm = q.split('=');
				if (parm[0] === 'users') return parm[1].split(',');
				return prev;
			}, null),
			userTos = searchArr.reduce((prev, q) => {
				const parm = q.split('=');
				if (parm[0] === 'userTos') return parm[1].split(',');
				return prev;
			}, null),
			skip = limit * (page - 1),
			allUsersHandle = Meteor.subscribe('adminUsers'),
			allUsersReady = allUsersHandle.ready();
	let filters = {},
			logs = [],
			users = [],
			allLogsHandle, allLogsReady, logCt;
	if (actions) filters.action = { $in: actions };
	if (userFroms) filters.user_id = { $in: userFroms };
	if (userTos) filters.to_id = { $in: userTos };
	allLogsHandle = Meteor.subscribe('adminLogs', filters, limit, skip);
	allLogsReady = allLogsHandle.ready();
	logCt = Counts.get('adminLogsCt');
	if (allLogsReady) logs = getLogs.call({ filters }, handleError);
	if (allUsersReady) users = getUsersForLogs.call({}, handleError);
	return {
		actions,
		limit,
		logCt,
		logs,
		page,
		pageReady: allLogsReady && allUsersReady,
		pathname,
		userFroms,
		users,
		userTos
	};
}, AdminLogs);
