/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import './AdminUsers.scss';
import { User } from '../../api/schema';
import { updateUserAdmin } from '../../api/collections/users';
import { displayError } from '../../api/global';

class AdminUsers extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  _togglePaid(user, ev) {
    const { paid } = user;
    updateUserAdmin.call({ userId: user._id, paid: !paid }, displayError);
  }
  _addBonus(user, numPoints, ev) {
    const { bonus_points } = user;
    updateUserAdmin.call({ userId: user._id, bonusPoints: numPoints }, displayError);
  }
  _toggleAdmin(user, ev) {
    const { is_admin } = user;
    updateUserAdmin.call({ userId: user._id, isAdmin: !is_admin }, displayError);
  }

  render() {
    const { pageReady, users } = this.props;
    return (
      <div className="row">
        <Helmet title="User Admin" />
        {pageReady ? (
          <div className="col-xs-12">
            <h3 className="title-text text-xs-center text-md-left hidden-md-up">User Admin</h3>
            <table className="table table-hover table-bordered admin-users-table">
              <thead>
                <tr>
                  <th colSpan={3}>Actions</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Team Name</th>
                  <th>Referred By</th>
                  <th>Verified?</th>
                  <th>Finished Registration?</th>
                  <th>Admin?</th>
                  <th>Paid?</th>
                  <th>Bonus Points</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={'user' + user._id}>
                    <td><i className="fa fa-fw fa-money toggle-paid" onClick={this._togglePaid.bind(null, user)} /></td>
                    <td><i className="fa fa-fw fa-plus add-bonus" onClick={this._addBonus.bind(null, user)} /></td>
                    <td><i className="fa fa-fw fa-user-secret" onClick={this._toggleAdmin.bind(null, user)} /></td>
                    <td>{`${user.first_name} ${user.last_name}`}</td>
                    <td>{user.email}</td>
                    <td>{user.team_name}</td>
                    <td>{user.referred_by === 'RETURNING' ? 'N/A' : user.referred_by}</td>
                    <td>{user.verified ? 'Y' : 'N'}</td>
                    <td>{user.done_registering ? 'Y' : 'N'}</td>
                    <td>{user.is_admin ? 'Y' : 'N'}</td>
                    <td>{user.paid ? 'Y' : 'N'}</td>
                    <td>{user.bonus_points}</td>
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
  if (allUsersReady) {
    users = User.find({}, { sort: { last_name: 1, first_name: 1 }}).fetch();
  }
  return {
    pageReady: allUsersReady,
    users
  };
}, AdminUsers);
