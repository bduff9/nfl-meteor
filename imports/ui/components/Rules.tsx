import React, { FC, memo } from 'react';

import { POOL_COST } from '../../api/constants';

const Rules: FC<{}> = (): JSX.Element => {
	const now = new Date();
	const month = now.getMonth();
	const year = now.getFullYear() - (month < 2 ? 1 : 0);

	return (
		<div className="rules">
			<h3>{`${year} Rules`}</h3>
			<ol>
				<li>
					Each pick must be submitted prior to the kickoff of the game. Any
					picks that were saved but not submitted will count, but all other
					empty picks count as zero points.
				</li>
				<li>
					In the event of a game ending in a tie, everyone loses that game.
				</li>
				<li>
					When making your picks for the week, you will notice a tie breaker
					box. This is always the final game of the week and your guess should
					be as close to the final total score (home team plus visiting team)
					without going over. This value is only used in the event of ties (see
					below). For example, if John Smith and Jane Doe both end a week with
					90 points and 10 games correctly picked, then this value is used to
					see who was closest to the actual total points of the final game
					without going over. If John chose 30 and Jane chose 33 and the actual
					total was 32 (Home team: 20, Visitor: 12), then John is the winner for
					the week since he was close to 32 without going over.
				</li>
				<li>
					Payouts will be to the highest point total each week, as well as the
					top three point totals overall at the end of the regular season. In
					the event of a tie, the number of games correctly picked is the first
					tie breaker. In the event that is also even, then the tie breaker
					score of the final game of the week is used. In the event that is also
					a tie, the players will split the winnings.
				</li>
				<li>
					After you submit your selections or the week ends, and picks are no
					longer changeable, you may view other players&apos; picks.
				</li>
				<li>
					All players are welcome, please feel free to invite anyone who would
					enjoy participating. All ${POOL_COST} entry fees must be received by
					the end of the third week. New players will be accepted up until the
					start of the third week and will be assigned the current lowest point
					total.
				</li>
				<li>
					The maximum number of points in 16-game weeks is 136 points, 120 in
					15-game weeks, 105 in 14-game weeks, and 91 in 13-game weeks.
				</li>
				<li>
					If the season ends prior to week 9, then every player will be given a
					refund. However, if week 9 completes and then the season ends early,
					all prizes will be paid out at the point just like the season
					completed.
				</li>
			</ol>
		</div>
	);
};

Rules.whyDidYouRender = true;

export default memo(Rules);
