/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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
      myPlace = (isOverall ? user.overall_place : tiebreaker.place_in_week),
      userId = user._id;
  let tied = '',
      aheadOfMe = 0,
      tiedMe = 0,
      behindMe = 0,
      place;
  if (isOverall && user.overall_tied_flag) tied = 'T';
  if (!isOverall && tiebreaker && tiebreaker.tied_flag) tied = 'T';
  data.forEach(u => {
    place = (isOverall ? u.overall_place : u.tiebreaker.place_in_week);
    if (place < myPlace) aheadOfMe++;
    if (place === myPlace && u._id !== userId) tiedMe++;
    if (place > myPlace) behindMe++;
  });

  const _customLabel = ({ cx, cy }) => {
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
        {`${tied}${myPlace} / ${data.length}`}
      </text>
    );
  };

  return (
    <div className="col-xs-12 dashboard-layout dash-layout-wrapper">
      {dataReady ? (
        <div className="row text-xs-center">
          {correctPoints || incorrectPoints || correctPicks.length || incorrectPicks.length ?
            <div className="col-xs-12 col-md-6">
              <ResponsiveContainer height={200}>
                <PieChart margin={{ left: 10, right: 10 }}>
                  <Pie data={[
                      { name: 'Points Earned', value: correctPoints, fill: '#0f0' },
                      { name: 'Points Missed', value: incorrectPoints, fill: '#f00' }
                    ]} outerRadius="40%" />
                  <Pie data={[
                      { name: 'Games Correct', value: correctPicks.length, fill: '#0f0' },
                      { name: 'Games Incorrect', value: incorrectPicks.length, fill: '#f00' }
                    ]} innerRadius="47%" outerRadius="60%" label />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            :
            null
          }
          {myPlace ?
            <div className="col-xs-12 col-md-6">
              <ResponsiveContainer height={200}>
                <PieChart margin={{ left: 10, right: 10 }}>
                  <Pie data={[
                      { name: 'Ahead of me', value: aheadOfMe, fill: '#f00' },
                      { name: 'Tied with me', value: tiedMe, fill: '#ff0' },
                      { name: 'I am ahead', value: behindMe, fill: '#0f0' }
                    ]} innerRadius="47%" outerRadius="60%" activeIndex={1} label={_customLabel} labelLine={false} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
