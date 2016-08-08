/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';

import Draggable from './Draggable';
import { getColor } from '../../api/global';

class PointHolder extends Draggable {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { className, disabledPoints, gameId, numGames, points, teamId, teamShort, thisRef } = this.props;
    return (
      <ul className={className} data-game-id={gameId} data-team-id={teamId} data-team-short={teamShort} ref={thisRef}>
        {points.map(point => <li className="points text-xs-center" style={getColor(point, numGames)} key={'point' + point}>{point}</li>)}
        {disabledPoints.map(point => <li className="points text-xs-center disabled" style={getColor(point, numGames)} key={'point' + point}>{point}</li>)}
      </ul>
    );
  }
}

PointHolder.propTypes = {
  className: PropTypes.string,
  disabledPoints: PropTypes.arrayOf(PropTypes.number).isRequired,
  gameId: PropTypes.string,
  numGames: PropTypes.number.isRequired,
  points: PropTypes.arrayOf(PropTypes.number).isRequired,
  sortableOptions: PropTypes.object.isRequired,
  teamId: PropTypes.string,
  teamShort: PropTypes.string,
  thisRef: PropTypes.string.isRequired
};

export default PointHolder;
