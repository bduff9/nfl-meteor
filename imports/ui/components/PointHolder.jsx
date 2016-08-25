/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import Sortable from 'sortablejs';

import { getColor } from '../../api/global';
import { setPick } from '../../api/collections/users';
import { displayError } from '../../api/global';

class PointHolder extends Component {
  constructor(props) {
    super();
    this.state = {};
    this._handlePointAdd = this._handlePointAdd.bind(this);
  }

  componentDidMount() {
    const { thisRef } = this.props,
        opts = {
          group: 'picks',
          sort: false,
          filter: '.disabled',
          onAdd: this._handlePointAdd,
          onMove: this._validatePointDrop
        };
    this._sortableInstance = Sortable.create(this.refs[thisRef], opts);
  }

  _validatePointDrop(ev) {
    const { dragged, to } = ev;
    let usedPoints;
    if (Sortable.utils.is(to, '.pointBank')) return true;
    if (Sortable.utils.is(to, '.disabled')) return false;
    if (to.children.length > 0) return false;
    usedPoints = Sortable.utils.find(Sortable.utils.closest(to, '.row'), 'li');
    usedPoints = Array.from(usedPoints).filter(point => Sortable.utils.is(point, '.points') && point !== dragged);
    return (usedPoints.length === 0);
  }
  _handlePointAdd(ev) {
    const { from, item, to } = ev,
        { selectedWeek } = this.props,
        pointVal = parseInt(item.innerText, 10),
        addOnly = (Sortable.utils.is(from, '.pointBank')),
        removeOnly = (Sortable.utils.is(to, '.pointBank'));
    setPick.call({ selectedWeek, fromData: from.dataset, toData: to.dataset, pointVal, addOnly, removeOnly }, displayError);
  }

  render() {
    const { className, disabledPoints, gameId, numGames, points, teamId, teamShort, thisRef } = this.props;
    return (
      <ul className={className} data-game-id={gameId} data-team-id={teamId} data-team-short={teamShort} ref={thisRef}>
        {points.map(point => <li className="points col-xs-12 text-xs-center" style={getColor(point, numGames)} key={'point' + point}>{point}</li>)}
        {disabledPoints.map(point => <li className="points col-xs-12 text-xs-center disabled" style={getColor(point, numGames)} key={'point' + point}>{point}</li>)}
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
  selectedWeek: PropTypes.number.isRequired,
  teamId: PropTypes.string,
  teamShort: PropTypes.string,
  thisRef: PropTypes.string.isRequired,
};

PointHolder._sortableInstance = null;

export default PointHolder;
