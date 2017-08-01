'use strict';

import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { DEFAULT_LEAGUE } from '../../api/constants';
import { SurvivorLayout } from '../layouts/SurvivorLayout.jsx';
import { getSurvivorUsers } from '../../api/collections/users';
import { getAllSurvivorPicks } from '../../api/collections/survivorpicks';

export default createContainer(({ weekForSec }) => {
	const currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
			survivorHandle = Meteor.subscribe('overallSurvivor', currentLeague, weekForSec),
			survivorReady = survivorHandle.ready(),
			usersHandle = Meteor.subscribe('basicUsersInfo'),
			usersReady = usersHandle.ready(),
			pageReady = survivorReady && usersReady;
	let users = [],
			survivor = [],
			alive = [],
			dead = [],
			graphData = [];
	if (pageReady) {
		users = getSurvivorUsers.call({ league: currentLeague });
		survivor = getAllSurvivorPicks.call({ league: currentLeague, week: weekForSec });
		for (let i = 0; i < weekForSec; i++) graphData[i] = { x: `Week ${i + 1}` };
		users.forEach(user => {
			const userSurvivor = survivor.filter(s => s.user_id === user._id),
					lastWeek = userSurvivor.filter(s => s.week === weekForSec)[0];
			let pick;
			if (userSurvivor.length < weekForSec) {
				dead.push(user);
			} else {
				if (!lastWeek.pick_id || (lastWeek.winner_id && lastWeek.pick_id !== lastWeek.winner_id)) {
					dead.push(user);
				} else {
					alive.push(user);
				}
			}
			if (!userSurvivor[0] || !userSurvivor[0].pick_id) return;
			for (let i = 0; i < weekForSec; i++) {
				pick = userSurvivor[i];
				if (pick && pick.pick_id) {
					graphData[i][`${user.first_name} ${user.last_name}`] = pick.pick_short;
				} else {
					break;
				}
			}
		});
	}
	return {
		alive,
		dead,
		graphData,
		isOverall: true,
		pageReady,
		weekForSec
	};
}, SurvivorLayout);
