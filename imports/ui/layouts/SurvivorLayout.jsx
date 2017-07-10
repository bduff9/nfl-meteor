'use strict';

import React, { PropTypes } from 'react';
import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Loading } from '../pages/Loading.jsx';

export const SurvivorLayout = ({ alive, dead, graphData, isOverall, pageReady, week, weekForSec }) => {
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
												<span>{`${user.first_name} ${user.last_name}${(!isOverall ? ' - ' + user.pick_short : '')}`}</span>
											</li>
										))}
									</ul>
								</td>
								<td>
									<ul className="text-danger dead">
										{dead.map(user => (
											<li key={'survivor' + user._id}>
												<span>{`${user.first_name} ${user.last_name}${(!isOverall ? ' - ' + (user.pick_short || 'N/A') : '')}`}</span>
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
	alive: PropTypes.arrayOf(PropTypes.object).isRequired,
	dead: PropTypes.arrayOf(PropTypes.object).isRequired,
	graphData: PropTypes.arrayOf(PropTypes.object).isRequired,
	isOverall: PropTypes.bool.isRequired,
	pageReady: PropTypes.bool.isRequired,
	week: PropTypes.number,
	weekForSec: PropTypes.number.isRequired
};
