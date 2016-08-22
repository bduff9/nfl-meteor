/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import './DashLayout.scss';
import { Loading } from '../pages/Loading.jsx';

export const DashLayout = ({ data, dataReady, highestScore, isOverall, sort, user, week, _changeSortBy }) => {
  const gamesSort = sort.total_games || sort['tiebreakers.$.games_correct'],
      pointsSort = sort.total_points || sort['tiebreakers.$.points_earned'],
      picks = (isOverall ? user.picks : user.picks.filter(pick => pick.week === week)),
      correctPicks = picks.filter(pick => pick.winner_id && pick.pick_id === pick.winner_id),
      incorrectPicks = picks.filter(pick => pick.winner_id && pick.pick_id !== pick.winner_id),
      correctPoints = correctPicks.reduce((prev, pick) => {
        return prev + pick.points;
      }, 0),
      incorrectPoints = incorrectPicks.reduce((prev, pick) => {
        if (pick.points) return prev + pick.points;
        return prev;
      }, 0),
      tiebreaker = week && user.tiebreakers[week - 1],
      myPlace = (isOverall ? user.overall_place : tiebreaker.place_in_week);
  let tied = '';
  if (isOverall && user.overall_tied_flag) tied = 'T';
  if (!isOverall && tiebreaker && tiebreaker.tied_flag) tied = 'T';
  return (
    <div className="col-xs-12 dashboard-layout">
      {dataReady ? (
        <div className="row text-xs-center">
          {correctPoints || incorrectPoints || correctPicks.length || incorrectPicks.length ?
            <div className="col-xs-6 col-sm-4">
              <ResponsiveContainer height={200}>
                <PieChart margin={{ left: 10, right: 10 }}>
                  <Pie data={[
                      { name: 'Points Earned', value: correctPoints, fill: '#0f0' },
                      { name: 'Points Missed', value: incorrectPoints, fill: '#f00' }
                    ]} outerRadius="45%" />
                  <Pie data={[
                      { name: 'Games Correct', value: correctPoints, fill: '#0f0' },
                      { name: 'Games Incorrect', value: incorrectPoints, fill: '#f00' }
                    ]} innerRadius="50%" outerRadius="60%" label />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            :
            null
          }
          {myPlace ?
            <div className="col-xs-6 col-sm-4">
              <PieChart
                data={[
                  {key: 'Ahead of me', value: myPlace - 1, color: '#f00'},
                  {key: 'I am ahead', value: data.length - myPlace, color: '#0f0'}
                ]}
                innerHoleSize={150}
                size={200} />
              <h3 className="my-rank">{`${tied}${myPlace} / ${data.length}`}</h3>
              <h4>Place</h4>
              <span className="text-muted">My Place</span>
            </div>
            :
            null
          }
          <div className="col-xs-12">
            <table className="table table-hover dashboard-table">
              <thead className="thead-default">
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th>Owner</th>
                  <th className="can-sort" onClick={_changeSortBy.bind(null, sort, 'games')}>
                    Games Correct&nbsp;
                    {gamesSort ? <i className={'fa fa-sort-' + (gamesSort === 1 ? 'asc' : 'desc')} /> : null}
                  </th>
                  <th className="can-sort" onClick={_changeSortBy.bind(null, sort, 'points')}>
                    Points Earned&nbsp;
                    {pointsSort ? <i className={'fa fa-sort-' + (pointsSort === 1 ? 'asc' : 'desc')} /> : null}
                  </th>
                  {isOverall ? <th>Missed Games?</th> : null}
                  {!isOverall ? <th>Tiebreaker</th> : null}
                  {!isOverall ? <th>Last Game</th> : null}
                  {!isOverall ? <th>Elim</th> : null}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  return (
                    <tr className={row._id === user._id ? 'my-place' : null} key={'place' + i}>
                      <td>{row.place}</td>
                      <td>{row.team_name || `${row.first_name}'s Team`}</td>
                      <td>{`${row.first_name} ${row.last_name}`}</td>
                      <td>{row.total_games}</td>
                      <td>{row.total_points}</td>
                      {isOverall ? <td>{row.missed_games}</td> : null}
                      {!isOverall ? <td>{row.tiebreaker.last_score}</td> : null}
                      {!isOverall ? <td>{row.tiebreaker.last_score_act}</td> : null}
                      {!isOverall ? <td>{row.possible_points < highestScore ? 'X' : null}</td> : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
      :
        <Loading />
      }
    </div>
  );
};

DashLayout.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataReady: PropTypes.bool.isRequired,
  highestScore: PropTypes.number,
  isOverall: PropTypes.bool.isRequired,
  sort: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  week: PropTypes.number,
  _changeSortBy: PropTypes.func.isRequired
};
