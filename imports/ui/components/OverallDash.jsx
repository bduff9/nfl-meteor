'use strict';

import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { NO_MISS_WEEK } from '../../api/constants';
import { sortForDash } from '../../api/global';
import { DashLayout } from '../layouts/DashLayout.jsx';
import { getCurrentUserSync, getUsersSync } from '../../api/collections/users';
import { getAllPicksSync } from '../../api/collections/picks';

export default createContainer(({ league, sortBy, _changeSortBy }) => {
	const myUser = getCurrentUserSync({}),
			picksHandle = Meteor.subscribe('allPicks', league),
			picksReady = picksHandle.ready(),
			usersHandle = Meteor.subscribe('overallPlaces'),
			usersReady = usersHandle.ready();
	let sort = sortBy || { total_points: -1, total_games: -1 },
			picks = [],
			myPicks = [],
			users = [],
			data = [];
	if (picksReady && usersReady) {
		picks = getAllPicksSync({ league });
		myPicks = picks.filter(pick => pick.user_id === myUser._id);
		users = getUsersSync({ activeOnly: true, league });
		data = users.map(u => {
			const missedGames = picks.filter(pick => {
				if (pick.week < NO_MISS_WEEK) return false;
				if (pick.user_id !== u._id) return false;
				return pick.winner_id && !pick.pick_id;
			});
			return {
				_id: u._id,
				first_name: u.first_name,
				last_name: u.last_name,
				team_name: u.team_name,
				missed_games: (missedGames.length > 0 ? 'Y' : ''),
				place: u.overall_place || 1,
				formattedPlace: (u.overall_place ? (u.overall_tied_flag ? `T${u.overall_place}` : u.overall_place) : 'T1'),
				total_games: u.total_games,
				total_points: u.total_points,
				overall_place: u.overall_place,
				overall_tied_flag: u.overall_tied_flag
			};
		});
		myUser.correctPicks = myPicks.filter(pick => pick.winner_id && pick.pick_id === pick.winner_id);
		myUser.incorrectPicks = myPicks.filter(pick => pick.winner_id && pick.pick_id !== pick.winner_id);
		myUser.correctPoints = myUser.correctPicks.reduce((prev, pick) => {
			return prev + pick.points;
		}, 0);
		myUser.incorrectPoints = myUser.incorrectPicks.reduce((prev, pick) => {
			if (pick.points) return prev + pick.points;
			return prev;
		}, 0),
		myUser.myPlace = myUser.overall_place || 1;
		let aheadOfMe = 0,
				tiedMe = 0,
				behindMe = 0;
		myUser.tied = (myUser.overall_tied_flag ? 'T' : '');
		data.sort(sortForDash.bind(null, sort.total_points, sort.total_games)).forEach(u => {
			const place = u.place,
					myPlace = myUser.myPlace;
			if (place < myPlace) aheadOfMe++;
			if (place === myPlace && u._id !== myUser._id) tiedMe++;
			if (place > myPlace) behindMe++;
		});
		myUser.aheadOfMe = aheadOfMe;
		myUser.tiedMe = tiedMe;
		myUser.behindMe = behindMe;
	}
	return {
		data,
		isOverall: true,
		myUser,
		pageReady: picksReady && usersReady,
		sort,
		_changeSortBy
	};
}, DashLayout);
