'use strict';

import React, { PropTypes } from 'react';

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
		<div style={{ maxWidth: '250px' }}>
			<div className={`pull-left ${which}Logo`}><img src={`/NFLLogos/${team.logo}`} /></div>
			<div className="pull-right">
				<div className={winner ? (thisTeamWon === teamWonPicks && winner !== 'TIE' ? 'text-success' : 'text-danger') : ''} title={`${picks / totalPicks * 100}%`}>Picked by: {picks} / {totalPicks}</div>
				<div className={winner ? (thisTeamWon === teamWonPoints && winner !== 'TIE' ? 'text-success' : 'text-danger') : ''} title={`${points / totalPoints * 100}%`}>Points for: {points} / {totalPoints}</div>
			</div>
		</div>
	);
};

StatsTeam.propTypes = {
	gameStats: PropTypes.object.isRequired,
	which: PropTypes.oneOf(['home', 'visitor']).isRequired
};

export default StatsTeam;
