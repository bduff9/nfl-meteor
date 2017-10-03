'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const StatsTeam = ({ gameStats, which }) => {
	const teamShort = gameStats[which],
			winner = gameStats.winner,
			picks = gameStats[`${teamShort}-picks`],
			points = gameStats[`${teamShort}-points`],
			totalPicks = gameStats.totalPicks,
			totalPoints = gameStats.totalPoints,
			team = gameStats[`${which}Team`],
			thisTeamWon = teamShort === winner,
			teamWonPicks = picks > totalPicks - picks,
			teamWonPoints = points > totalPoints - points;

	return (
		<div style={{ height: '100%' }}>
			<div className={`stat-logo ${which}Logo`}>
				<img src={`/NFLLogos/${team.logo}`} />
			</div>
			<div className="stat-text">
				<div className={winner ? (thisTeamWon === teamWonPicks && winner !== 'TIE' ? 'text-success' : 'text-danger') : ''} title={`${picks / totalPicks * 100}%`}>
					<span className="no-wrap">Picked by: </span>
					<br className="hidden-md-up" />
					<span className="no-wrap">{picks} / {totalPicks}</span>
				</div>
				<div className={winner ? (thisTeamWon === teamWonPoints && winner !== 'TIE' ? 'text-success' : 'text-danger') : ''} title={`${points / totalPoints * 100}%`}>
					<span className="no-wrap">Points for: </span>
					<br className="hidden-md-up" />
					<span className="no-wrap">{points} / {totalPoints}</span>
				</div>
			</div>
		</div>
	);
};

StatsTeam.propTypes = {
	gameStats: PropTypes.object.isRequired,
	which: PropTypes.oneOf(['home', 'visitor']).isRequired
};

export default StatsTeam;
