/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Loading } from './Loading.jsx';
import { NFLLog, User } from '../../api/schema';
import { displayError } from '../../api/global';
import { ACTIONS } from '../../api/constants';

class AdminLogs extends Component {
  constructor(props) {
    super();
    this.state = {};
    this._changePage = this._changePage.bind(this);
  }

  _changePage(dir, disabled, ev) {
    const { limit, page, pathname } = this.props,
        newPage = page + dir,
        pageChanged = newPage !== 1,
        limitChanged = limit !== 10;
    let newPath = pathname;
    ev.preventDefault();
    if (!disabled) {
      if (pageChanged) newPath += `?page=${newPage}`;
      if (limit !== 10) newPath += `${pageChanged ? '&' : '?'}limit=${limit}`;
      this.context.router.push(newPath);
    }
    return false;
  }

  render() {
    const { limit, logCt, logs, page, pageReady } = this.props,
        totalPages = Math.ceil(logCt / limit),
        hasPrev = page > 1,
        hasNext = (page * limit) < logCt;
    return (
      <div className="row admin-logs">
        <Helmet title="View All Logs" />
        <nav className="text-xs-right">
          <ul className="pagination">
            <li className={'page-item' + (!hasPrev ? ' disabled' : '')}>
              <a className="page-link" href="#" aria-label="Previous" onClick={this._changePage.bind(null, -1, !hasPrev)}>
                <span aria-hidden="true">&laquo;</span>
                <span className="sr-only">Previous</span>
              </a>
            </li>
            <li className="page-item disabled">
              <a className="page-link" href="#">Page {page} of {totalPages}</a>
            </li>
            <li className={'page-item' + (!hasNext ? ' disabled' : '')}>
              <a className="page-link" href="#" aria-label="Next" onClick={this._changePage.bind(null, 1, !hasNext)}>
                <span aria-hidden="true">&raquo;</span>
                <span className="sr-only">Next</span>
              </a>
            </li>
          </ul>
        </nav>
        {pageReady ? (
          <div className="col-xs-12">
            <h3 className="title-text text-xs-center text-md-left hidden-md-up">View All Logs</h3>
            <table className="table table-hover table-bordered admin-logs-table">
              <thead>
                <tr>
                  <th>
                    <div className="dropdown filter">
                      <button className="btn btn-secondary dropdown-toggle" type="button" id="action-filter" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Action
                      </button>
                      <div className="dropdown-menu" aria-labelledby="action-filter">
                        {ACTIONS.map((action, i) => (
                          <a className="dropdown-item" href="#" onClick={null} key={'action' + i}>{action}</a>
                        ))}
                      </div>
                    </div>
                  </th>
                  <th>Time</th>
                  <th>Message</th>
                  <th>User</th>
                  <th>Is read?</th>
                  <th>Is deleted?</th>
                  <th>To User</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const user = log.getUser(),
                      userTo = log.getUserTo();
                  return (
                    <tr key={'log' + log._id}>
                      <td>{log.action}</td>
                      <td>{moment(log.when).format('h:mma [on] ddd, MMM Do, YYYY')}</td>
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
  limit: PropTypes.number.isRequired,
  logCt: PropTypes.number.isRequired,
  logs: PropTypes.arrayOf(PropTypes.object).isRequired,
  page: PropTypes.number.isRequired,
  pageReady: PropTypes.bool.isRequired,
  pathname: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(PropTypes.object).isRequired
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
      skip = limit * page,
      allLogsHandle = Meteor.subscribe('adminLogs', limit, skip),
      allLogsReady = allLogsHandle.ready(),
      allUsersHandle = Meteor.subscribe('adminUsers'),
      allUsersReady = allUsersHandle.ready(),
      logCt = Counts.get('adminLogsCt');
  let logs = [],
      users = [];
  if (allLogsReady) {
    logs = NFLLog.find({}, { sort: { when: 1 }}).fetch();
  }
  if (allUsersReady) {
    users = User.find({}).fetch();
  }
  return {
    limit,
    logCt,
    logs,
    page,
    pageReady: allLogsReady && allUsersReady,
    pathname,
    users
  };
}, AdminLogs);
