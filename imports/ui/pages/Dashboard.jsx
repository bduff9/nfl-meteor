/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';

import { refreshGames } from '../../api/collections/games';
import { displayError } from '../../api/global';

class Dashboard extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  _refreshGames(ev) {
    refreshGames.call(displayError);
  }

  render() {
    const { currentWeek, selectedWeek } = this.props;
    return (
      <div>
        <h3>Dashboard</h3>
        Current Week: {currentWeek}
        <br />
        Selected Week: {selectedWeek}
        <br />
        <button type="button" className="btn btn-primary" onClick={this._refreshGames}>
          <i className="fa fa-fw fa-refresh"></i>
          Refresh Game Data
        </button>
      </div>
    );
  }
}

Dashboard.propTypes = {
  currentWeek: PropTypes.number,
  selectedWeek: PropTypes.number
};

export default createContainer(() => {
  const currentWeek = Session.get('currentWeek'),
      selectedWeek = Session.get('selectedWeek');
  return {
    currentWeek,
    selectedWeek
  };
}, Dashboard);
