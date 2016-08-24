/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Loading } from '../pages/Loading.jsx';

export const SurvivorLayout = ({ data, isOverall, pageReady, week, weekForSec }) => {
  let alive = [],
      dead = [],
      graphData = [],
      lastWeek, pick, thisWeek, team, index;
  if (isOverall) {
    for (let i = 0; i < weekForSec; i++) graphData[i] = { x: `Week ${i + 1}` };
    data.forEach(user => {
      lastWeek = user.survivor[weekForSec - 1];
      if (user.survivor.length < weekForSec) {
        dead.push(user);
      } else {
        if (!lastWeek.pick_id || (lastWeek.winner_id && lastWeek.pick_id !== lastWeek.winner_id)) {
          dead.push(user);
        } else {
          alive.push(user);
        }
      }
      if (!user.survivor[0].pick_id) return;
      for (let i = 0; i < weekForSec; i++) {
        pick = user.survivor[i];
        if (pick.pick_id) {
          graphData[i][`${user.first_name} ${user.last_name}`] = pick.pick_short;
        } else {
          break;
        }
      }
    });
  } else {
    data.forEach(user => {
      thisWeek = user.survivor[0];
      if (!thisWeek.pick_id || (thisWeek.winner_id && thisWeek.pick_id !== thisWeek.winner_id)) {
        dead.push(user);
      } else {
        alive.push(user);
      }
      if (!thisWeek.pick_id) return;
      teamShort = thisWeek.pick_short;
      index = graphData.findIndex(team => team.team === teamShort);
      if (index === -1) {
        graphData.push({ team: teamShort, count: 1, won: (thisWeek.winner_id && thisWeek.pick_id === thisWeek.winner_id ? true : false), lost: (thisWeek.winner_id && thisWeek.pick_id !== thisWeek.winner_id ? true : false)});
      } else {
        graphData[index].count += 1;
      }
    });
  }
  return (
    <div className="col-xs-12 survivor-layout">
      {pageReady ? (
        <div>
          <table className="table table-hover view-survivor-table">
            <thead>
              <tr>
                <th>Surviving</th>
                <th>Dead</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ul className="text-success alive">
                    {alive.map(user => (
                      <li key={'survivor' + user._id}>
                        <span>{`${user.first_name} ${user.last_name}${(!isOverall ? ' - ' + user.survivor[0].pick_short : '')}`}</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul className="text-danger dead">
                    {dead.map(user => (
                      <li key={'survivor' + user._id}>
                        <span>{`${user.first_name} ${user.last_name}${(!isOverall ? ' - ' + (user.survivor[0].pick_short || 'N/A') : '')}`}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
          {isOverall ? (
            <ResponsiveContainer height={300}>
              <LineChart data={graphData} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
                {alive.map(user => <Line type="monotone" dataKey={`${user.first_name} ${user.last_name}`} stroke="#0f0" key={'line' + user._id} />)}
                {dead.map(user => <Line type="monotone" dataKey={`${user.first_name} ${user.last_name}`} stroke="#f00" key={'line' + user._id} />)}
                <XAxis dataKey="x" type="category" />
                <YAxis type="category" />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          )
          :
          (
            <ResponsiveContainer height={300}>
              <BarChart data={graphData}>
                <Bar dataKey="count">
                  {graphData.map(team => <Cell fill={(team.won ? '#0f0' : (team.lost ? '#f00' : '#999'))} key={'line' + team.team} />)}
                </Bar>
                <XAxis dataKey="team" type="category" />
                <YAxis allowDecimals={false} type="number" />
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )
      :
        <Loading />
      }
    </div>
  );
};

SurvivorLayout.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  isOverall: PropTypes.bool.isRequired,
  pageReady: PropTypes.bool.isRequired,
  week: PropTypes.number,
  weekForSec: PropTypes.number.isRequired
};
