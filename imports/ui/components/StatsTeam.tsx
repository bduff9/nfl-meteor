import React, { FC } from 'react';

import { TGameTeam } from '../../api/commonTypes';

export type TStatsTeamProps = {
	gameStats: unknown;
	which: Exclude<TGameTeam, 'winner'>;
};

const StatsTeam: FC<TStatsTeamProps> = ({ gameStats, which }): JSX.Element => {
	const teamShort = gameStats[which];
	const winner = gameStats.winner;
	const picks = gameStats[`${teamShort}-picks`];
	const points = gameStats[`${teamShort}-points`];
	const totalPicks = gameStats.totalPicks;
	const totalPoints = gameStats.totalPoints;
	const team = gameStats[`${which}Team`];
	const thisTeamWon = teamShort === winner;
	const teamWonPicks = picks > totalPicks - picks;
	const teamWonPoints = points > totalPoints - points;

	return (
		<div style={{ height: '100%' }}>
			<div className={`stat-logo ${which}Logo`}>
				<img src={`/NFLLogos/${team.logo}`} />
			</div>
			<div className="stat-text">
				<div
					className={
						winner
							? thisTeamWon === teamWonPicks && winner !== 'TIE'
								? 'text-success'
								: 'text-danger'
							: ''
					}
					title={`${(picks / totalPicks) * 100}%`}
				>
					<span className="no-wrap">Picked by: </span>
					<br className="d-md-none" />
					<span className="no-wrap">
						{picks} / {totalPicks}
					</span>
				</div>
				<div
					className={
						winner
							? thisTeamWon === teamWonPoints && winner !== 'TIE'
								? 'text-success'
								: 'text-danger'
							: ''
					}
					title={`${(points / totalPoints) * 100}%`}
				>
					<span className="no-wrap">Points for: </span>
					<br className="d-md-none" />
					<span className="no-wrap">
						{points} / {totalPoints}
					</span>
				</div>
			</div>
		</div>
	);
};

StatsTeam.whyDidYouRender = true;

export default StatsTeam;
