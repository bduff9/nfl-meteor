/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Loading } from './Loading.jsx';
import OverallDash from '../components/OverallDash.jsx';
import WeekDash from '../components/WeekDash.jsx';
import { User } from '../../api/schema';
import { updateSelectedWeek } from '../../api/collections/users';
import { displayError } from '../../api/global';

class Dashboard extends Component {
  constructor(props) {
    super();
    this.state = {
      sortBy: null,
      viewOverall: false
    };
    this._changeSortBy = this._changeSortBy.bind(this);
    this._toggleOverall = this._toggleOverall.bind(this);
  }

  _changeSortBy(currSort, col, ev) {
    const { viewOverall } = this.state,
        newSort = Object.assign({}, currSort),
        { total_games, total_points, 'tiebreakers.$.games_correct': week_games, 'tiebreakers.$.points_earned': week_points } = newSort;
    if (col === 'games') {
      if (viewOverall) {
        newSort.total_games = this._nextOrd(total_games, total_points);
      } else {
        newSort['tiebreakers.$.games_correct'] = this._nextOrd(week_games, week_points);
      }
    } else if (col === 'points') {
      if (viewOverall) {
        newSort.total_points = this._nextOrd(total_points, total_games);
      } else {
        newSort['tiebreakers.$.points_earned'] = this._nextOrd(week_points, week_games);
      }
    }
    this.setState({ sortBy: newSort });
  }
  _nextOrd(num, otherNum) {
    if (num === 1) {
      return -1;
    } else if (num === -1 && otherNum) {
      return undefined;
    } else {
      return 1;
    }
  }
  _selectWeek(ev) {
    const newWeek = parseInt(ev.currentTarget.value, 10);
    ev.preventDefault();
    updateSelectedWeek.call({ week: newWeek }, displayError);
  }
  _toggleOverall(ev) {
    const viewOverall = ev.currentTarget.value === 'true';
    this.setState({ sortBy: null, viewOverall });
  }

  render() {
    const { sortBy, viewOverall } = this.state,
        { pageReady, selectedWeek } = this.props,
        user = User.findOne(Meteor.userId());
    return (
      <div className="row dashboard-wrapper">
        <Helmet title={`My Dashboard`} />
        <h3 className="title-text text-xs-center text-md-left hidden-md-up">My Dashboard</h3>
        {pageReady ? (
          <div className="col-xs-12 dashboard">
            <div className="col-xs-6">
              <div className="form-group">
                <label htmlFor="view-overall">View:</label>
                <select className="form-control" id="view-overall" value={'' + viewOverall} onChange={this._toggleOverall}>
                  <option value="true">Overall</option>
                  <option value="false">Week</option>
                </select>
              </div>
            </div>
            {!viewOverall ? (
              <div className="col-xs-6">
                <div className="form-group">
                  <label htmlFor="select-week-for-dashboard">Jump to:</label>
                  <select className="form-control" value={selectedWeek} onChange={this._selectWeek}>
                    {user.tiebreakers.map((week, i) => <option value={week.week} key={'week' + i}>{`Week ${week.week}`}</option>)}
                  </select>
                </div>
              </div>
            )
            :
              null
            }
            {viewOverall ?
              <OverallDash
                sortBy={sortBy}
                user={user}
                _changeSortBy={this._changeSortBy} />
            :
              <WeekDash
                sortBy={sortBy}
                user={user}
                week={selectedWeek}
                _changeSortBy={this._changeSortBy} />
            }
          </div>
        )
        :
          <Loading />
        }
      </div>
    );
  }
}

Dashboard.propTypes = {
  pageReady: PropTypes.bool.isRequired,
  selectedWeek: PropTypes.number
};

export default createContainer(() => {
  const selectedWeek = Session.get('selectedWeek');
  return {
    pageReady: !!selectedWeek,
    selectedWeek
  };
}, Dashboard);
