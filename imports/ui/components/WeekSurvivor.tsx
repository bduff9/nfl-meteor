import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import {
	getWeekSurvivorPicks,
	TSurvivorPick,
} from '../../api/collections/survivorpicks';
import { getSurvivorUsers } from '../../api/collections/users';
import { TWeek } from '../../api/commonTypes';
import { DEFAULT_LEAGUE } from '../../api/constants';
import {
	SurvivorLayout,
	TGraphData,
	TSurvivorLayoutProps,
	TSurvivorUser,
} from '../layouts/SurvivorLayout';

export type TWeekSurvivorProps = {
	week: TWeek;
	weekForSec: TWeek;
};

export default withTracker<TSurvivorLayoutProps, TWeekSurvivorProps>(
	({ week, weekForSec }): TSurvivorLayoutProps => {
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: 	Eventually will need to uncomment this and allow them to change current league
		const weekForSurvivor = Math.min(week, weekForSec);
		const survivorHandle = Meteor.subscribe(
			'weekSurvivor',
			currentLeague,
			weekForSurvivor,
		);
		const survivorReady = survivorHandle.ready();
		const usersHandle = Meteor.subscribe('basicUsersInfo');
		const usersReady = usersHandle.ready();
		const pageReady = survivorReady && usersReady;
		let users: TSurvivorUser[] = [];
		let survivor: TSurvivorPick[] = [];
		const alive: TSurvivorUser[] = [];
		const dead: TSurvivorUser[] = [];
		const graphData: TGraphData[] = [];

		if (pageReady) {
			users = getSurvivorUsers.call({ league: currentLeague });
			survivor = getWeekSurvivorPicks.call({ league: currentLeague, week });

			users.forEach(
				(user): void => {
					const userSurvivor = survivor.filter(
						(s): boolean => s.user_id === user._id,
					);
					const thisWeek = userSurvivor.filter(
						(s): boolean => s.week === week,
					)[0];

					if (!thisWeek) return;

					if (
						!thisWeek.pick_id ||
						(thisWeek.winner_id && thisWeek.pick_id !== thisWeek.winner_id)
					) {
						dead.push(user);
					} else {
						alive.push(user);
					}

					if (!thisWeek || !thisWeek.pick_id) return;

					const teamShort = thisWeek.pick_short || '';

					// eslint-disable-next-line @typescript-eslint/camelcase
					user.pick_short = teamShort;

					const index = graphData.findIndex(team => team.team === teamShort);

					if (index === -1) {
						graphData.push({
							team: teamShort,
							count: 1,
							won:
								thisWeek.winner_id && thisWeek.pick_id === thisWeek.winner_id
									? true
									: false,
							lost:
								thisWeek.winner_id && thisWeek.pick_id !== thisWeek.winner_id
									? true
									: false,
						});
					} else {
						graphData[index].count += 1;
					}
				},
			);
		}

		return {
			alive,
			dead,
			graphData,
			isOverall: false,
			pageReady,
			week,
			weekForSec,
		};
	},
)(SurvivorLayout);
