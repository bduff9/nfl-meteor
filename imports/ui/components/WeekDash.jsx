'use strict';

import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { DashLayout } from '../layouts/DashLayout.jsx';
import { displayError } from '../../api/global';
import { getCurrentUser } from '../../api/collections/users';
import { getTiebreaker, getAllTiebreakersForWeek} from '../../api/collections/tiebreakers';
import { getAllPicksForWeek } from '../../api/collections/picks';

export default createContainer(({ league, sortBy, week, _changeSortBy }) => {
	//TODO: subscribe to tiebreakers and all users and all picks

	const myUser = getCurrentUser.call({}, displayError),
			tiebreakerHandle = Meteor.subscribe('singleTiebreakerForUser', week, league),
			tiebreakerReady = tiebreakerHandle.ready(),
			picksHandle = Meteor.subscribe('allPicksForWeek', week, league),
			picksReady = picksHandle.ready(),
			tiebreakersHandle = Meteor.subscribe('allTiebreakersForWeek', week, league),
			tiebreakersReady = tiebreakersHandle.ready(),
			usersHandle = Meteor.subscribe('basicUsersInfo'),
			usersReady = usersHandle.ready(),
			sort = sortBy || { points_earned: -1, games_correct: -1 };
	let tiebreaker = {},
			tiebreakers = [],
			picks = [],
			highestScore = 0,
			data = [];
	if (picksReady && tiebreakerReady && tiebreakersReady) {
		picks = getAllPicksForWeek.call({ league, week }, displayError);
		tiebreaker = getTiebreaker.call({ league, week }, displayError);
		tiebreakers = getAllTiebreakersForWeek.call({ league, week }, displayError);
		data = tiebreakers.map((tb, i, allTiebreakers) => {
			const tiebreaker = Object.assign({}, tb),
					place = (tiebreaker.place_in_week ? (tiebreaker.tied_flag ? `T${tiebreaker.place_in_week}` : tiebreaker.place_in_week) : 'T1'),
					hasSubmitted = tiebreaker.submitted;
			highestScore = Math.max(highestScore, tiebreaker.points_earned);
			if (!hasSubmitted) tiebreaker.last_score = null;
			//TODO: Create obj here and get user to finish populating it
			return {
				_id: u._id,
				first_name: u.first_name,
				last_name: u.last_name,
				team_name: u.team_name,
				place,
				possible_games: u.picks.reduce((prev, pick) => {
					if (pick.week !== week) return prev;
					if (pick.pick_id === pick.winner_id || (pick.pick_id && !pick.winner_id)) {
						return prev + 1;
					}
					return prev;
				}, 0),
				possible_points: u.picks.reduce((prev, pick) => {
					if (pick.week !== week) return prev;
					if (pick.pick_id === pick.winner_id || (pick.pick_id && !pick.winner_id)) {
						return prev + (pick.points || 0);
					}
					return prev;
				}, 0),
				tiebreaker,
				total_games: tiebreaker.games_correct,
				total_points: tiebreaker.points_earned
			};
		});
	}
	return {
		data,
		highestScore,
		isOverall: false,
		pageReady: dataReady,
		picks, //TODO: populate this for dashlayout with this week's picks
		sort,
		tiebreaker, //TODO: populate this for current user
		week,
		_changeSortBy
	};
}, DashLayout);
