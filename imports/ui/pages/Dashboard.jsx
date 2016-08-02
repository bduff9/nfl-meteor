/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { User } from '../../api/schema';
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
  _selectWeek(ev) {
    const newWeek = parseInt(ev.currentTarget.value, 10);
    ev.preventDefault();
    Session.set('selectedWeek', newWeek);
//TODO session is not persistent, amplify? http://stackoverflow.com/questions/13371324/meteor-session-and-browser-refreshes
  }

  render() {
    const { currentWeek, selectedWeek, weeks } = this.props;
    return (
      <div>
        <Helmet title="NFL Dashboard" />
        <h3>Dashboard</h3>
        Current Week: {currentWeek}
        <br />
        Selected Week:
        <select value={selectedWeek} onChange={this._selectWeek}>
          {weeks.map((week, i) => <option value={week.week} key={'week' + i}>{`Week ${week.week}`}</option>)}
        </select>
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
      selectedWeek = Session.get('selectedWeek'),
      weeks = User.findOne(Meteor.userId()).tiebreakers;
  return {
    currentWeek,
    selectedWeek,
    weeks
  };
}, Dashboard);
