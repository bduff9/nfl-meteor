/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { NFLLog } from '../../api/schema';
import { displayError } from '../../api/global';

class AdminLogs extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    const { logs, pageReady } = this.props;
    return (
      <div className="row admin-logs">
        <Helmet title="View All Logs" />
        {pageReady ? (
          <div className="col-xs-12">
            <h3 className="title-text text-xs-center text-md-left hidden-md-up">View All Logs</h3>
            <table className="table table-hover table-bordered admin-logs-table">
              <thead>
                <tr>
                  <th>Action</th>
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
                      <td>{moment(log.when).format('h:mma [on] ddd, MMM Do')}</td>
                      <td>{log.message}</td>
                      <td>{user ? `${user.first_name} ${user.last_name}` : ''}</td>
                      <td>{log.is_read ? 'Y' : 'N'}</td>
                      <td>{log.is_deleted ? 'Y' : 'N'}</td>
                      <td>{userTo ? `${userTo.first_name} ${userTo.last_name}` : ''}</td>
                    </tr>
                  );
                })}
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

AdminLogs.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.object).isRequired,
  pageReady: PropTypes.bool.isRequired
};

export default createContainer(() => {
  const allLogsHandle = Meteor.subscribe('adminLogs'),
      allLogsReady = allLogsHandle.ready(),
      allUsersHandle = Meteor.subscribe('adminUsers'),
      allUsersReady = allUsersHandle.ready();
  let logs = [];
  if (allLogsReady) {
    logs = NFLLog.find({}, { sort: { when: -1 }}).fetch();
  }
  return {
    logs,
    pageReady: allLogsReady && allUsersReady
  };
}, AdminLogs);
