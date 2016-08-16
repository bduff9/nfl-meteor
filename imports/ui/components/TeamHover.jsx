/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import './TeamHover.scss';
import { Team } from '../../api/schema';

class TeamHover extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    const { pageReady, teamInfo } = this.props;
    let won, lost, tied;
    if (pageReady) {
      won = teamInfo.history.reduce((prev, game) => {
        if (game.did_win) return prev + 1;
        return prev;
      }, 0);
      lost = teamInfo.history.reduce((prev, game) => {
        if (!game.did_win && !game.did_tie) return prev + 1;
        return prev;
      }, 0);
      tied = teamInfo.history.reduce((prev, game) => {
        if (game.did_tie) return prev + 1;
        return prev;
      }, 0);
    }

    return (
      <table className="team-hover" style={{ color: teamInfo.secondary_color, backgroundColor: teamInfo.primary_color }}>
        <thead>
          <tr>
            <th>{`${teamInfo.city} ${teamInfo.name}`}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{`${teamInfo.conference} ${teamInfo.division}`}</td>
          </tr>
          <tr>
            <td>{`Rushing Offense: ${teamInfo.rush_offense} Passing Offense: ${teamInfo.pass_offense}`}</td>
          </tr>
          <tr>
            <td>{`Rushing Defense: ${teamInfo.rush_defense} Passing Defense: ${teamInfo.pass_defense}`}</td>
          </tr>
          <tr>
            <td>{`Conference Rank: ${teamInfo.rank}`}</td>
          </tr>
          <tr>
            <td>{`Record: ${won}-${lost}-${tied}`}</td>
          </tr>
          {pageReady ? teamInfo.history.map(game => (
            <tr><td>xxx</td></tr>
          )) : null}
        </tbody>
      </table>
    );
  }
}

TeamHover.propTypes = {
  pageReady: PropTypes.bool.isRequired,
  teamInfo: PropTypes.object.isRequired
};

export default createContainer(({ teamId }) => {
  const teamHandle = Meteor.subscribe('getTeamInfo', teamId),
      teamReady = teamHandle.ready();
  let teamInfo = {},
      pageReady = false;
  if (teamReady) {
    teamInfo = Team.findOne(teamId);
    pageReady = true;
  }
  return {
    pageReady,
    teamInfo
  };
}, TeamHover);
