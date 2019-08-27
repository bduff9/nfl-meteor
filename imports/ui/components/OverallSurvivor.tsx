import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import {
	getAllSurvivorPicks,
	TSurvivorPick,
} from '../../api/collections/survivorpicks';
import { getSurvivorUsers } from '../../api/collections/users';
import { TWeek } from '../../api/commonTypes';
import { DEFAULT_LEAGUE } from '../../api/constants';
import {
	SurvivorLayout,
	TSurvivorLayoutProps,
	TSurvivorUser,
	TGraphData,
} from '../layouts/SurvivorLayout';

export type TOverallSurvivorProps = {
	weekForSec: TWeek;
};

export default withTracker<TSurvivorLayoutProps, TOverallSurvivorProps>(
	({ weekForSec }): TSurvivorLayoutProps => {
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
		const survivorHandle = Meteor.subscribe(
			'overallSurvivor',
			currentLeague,
			weekForSec,
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
			survivor = getAllSurvivorPicks.call({
				league: currentLeague,
				week: weekForSec,
			});

			for (let i = 0; i < weekForSec; i++)
				graphData[i] = { x: `Week ${i + 1}` };

			users.forEach(
				(user): void => {
					const userSurvivor = survivor.filter(s => s.user_id === user._id);
					const lastWeek = userSurvivor.filter(s => s.week === weekForSec)[0];
					let pick;

					if (userSurvivor.length < weekForSec) {
						dead.push(user);
					} else {
						if (
							!lastWeek.pick_id ||
							(lastWeek.winner_id && lastWeek.pick_id !== lastWeek.winner_id)
						) {
							dead.push(user);
						} else {
							alive.push(user);
						}
					}

					if (!userSurvivor[0] || !userSurvivor[0].pick_id) return;

					for (let i = 0; i < weekForSec; i++) {
						pick = userSurvivor[i];

						if (pick && pick.pick_id) {
							graphData[i][`${user.first_name} ${user.last_name}`] =
								pick.pick_short || '';
						} else {
							break;
						}
					}
				},
			);
		}

		return {
			alive,
			dead,
			graphData,
			isOverall: true,
			pageReady,
			weekForSec,
		};
	},
)(SurvivorLayout);
