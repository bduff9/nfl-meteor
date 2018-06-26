'use strict';

import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { DEFAULT_LEAGUE } from '../../api/constants';
import { SurvivorLayout } from '../layouts/SurvivorLayout.jsx';
import { getSurvivorUsers } from '../../api/collections/users';
import { getWeekSurvivorPicks } from '../../api/collections/survivorpicks';

export default withTracker(({ week, weekForSec }) => {
	const currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
			weekForSurvivor = Math.min(week, weekForSec),
			survivorHandle = Meteor.subscribe('weekSurvivor', currentLeague, weekForSurvivor),
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
		survivor = getWeekSurvivorPicks.call({ league: currentLeague, week });
		users.forEach(user => {
			const userSurvivor = survivor.filter(s => s.user_id === user._id),
					thisWeek = userSurvivor.filter(s => s.week === week)[0];
			let teamShort, index;
			if (!thisWeek) return;
			if (!thisWeek.pick_id || (thisWeek.winner_id && thisWeek.pick_id !== thisWeek.winner_id)) {
				dead.push(user);
			} else {
				alive.push(user);
			}
			if (!thisWeek || !thisWeek.pick_id) return;
			teamShort = thisWeek.pick_short;
			user.pick_short = teamShort;
			index = graphData.findIndex(team => team.team === teamShort);
			if (index === -1) {
				graphData.push({ team: teamShort, count: 1, won: (thisWeek.winner_id && thisWeek.pick_id === thisWeek.winner_id ? true : false), lost: (thisWeek.winner_id && thisWeek.pick_id !== thisWeek.winner_id ? true : false)});
			} else {
				graphData[index].count += 1;
			}
		});
	}
	return {
		alive,
		dead,
		graphData,
		isOverall: false,
		pageReady,
		weekForSec
	};
})(SurvivorLayout);
