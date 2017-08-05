'use strict';

import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { DashLayout } from '../layouts/DashLayout.jsx';
import { sortForDash } from '../../api/global';
import { getCurrentUser } from '../../api/collections/users';
import { getAllTiebreakersForWeek, getTiebreaker } from '../../api/collections/tiebreakers';
import { getAllPicksForWeek } from '../../api/collections/picks';

export default createContainer(({ league, sortBy, week, _changeSortBy }) => {
	const myUser = getCurrentUser.call({}),
			tiebreakerHandle = Meteor.subscribe('singleTiebreakerForUser', week, league),
			tiebreakerReady = tiebreakerHandle.ready(),
			picksHandle = Meteor.subscribe('allPicksForWeek', week, league),
			picksReady = picksHandle.ready(),
			tiebreakersHandle = Meteor.subscribe('allTiebreakersForWeek', week, league),
			tiebreakersReady = tiebreakersHandle.ready(),
			usersHandle = Meteor.subscribe('basicUsersInfo'),
			usersReady = usersHandle.ready(),
			sort = sortBy || { points_earned: -1, games_correct: -1 };
	let myTiebreaker = {},
			tiebreakers = [],
			picks = [],
			myPicks = [],
			highestScore = 0,
			data = [];
	if (picksReady && tiebreakerReady && tiebreakersReady && usersReady) {
		picks = getAllPicksForWeek.call({ league, week });
		myPicks = picks.filter(pick => pick.user_id === myUser._id);
		myTiebreaker = getTiebreaker.call({ league, week });
		tiebreakers = getAllTiebreakersForWeek.call({ league, week });
		data = tiebreakers.map((tb, i, allTiebreakers) => {
			const tiebreaker = Object.assign({}, tb),
					user = tb.getUser(),
					userPicks = picks.filter(pick => pick.user_id === user._id),
					formattedPlace = (tiebreaker.place_in_week ? (tiebreaker.tied_flag ? `T${tiebreaker.place_in_week}` : tiebreaker.place_in_week) : 'T1'),
					hasSubmitted = tiebreaker.submitted;
			highestScore = Math.max(highestScore, tiebreaker.points_earned);
			if (!hasSubmitted) tiebreaker.last_score = null;
			return {
				_id: user._id,
				first_name: user.first_name,
				last_name: user.last_name,
				team_name: user.team_name,
				place: tiebreaker.place_in_week || 1,
				formattedPlace,
				possible_games: userPicks.reduce((prev, pick) => {
					if (pick.week !== week) return prev;
					if (pick.pick_id === pick.winner_id || (pick.pick_id && !pick.winner_id)) {
						return prev + 1;
					}
					return prev;
				}, 0),
				possible_points: userPicks.reduce((prev, pick) => {
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
		myUser.correctPicks = myPicks.filter(pick => pick.winner_id && pick.pick_id === pick.winner_id);
		myUser.incorrectPicks = myPicks.filter(pick => pick.winner_id && pick.pick_id !== pick.winner_id);
		myUser.correctPoints = myUser.correctPicks.reduce((prev, pick) => {
			return prev + pick.points;
		}, 0);
		myUser.incorrectPoints = myUser.incorrectPicks.reduce((prev, pick) => {
			if (pick.points) return prev + pick.points;
			return prev;
		}, 0),
		myUser.myPlace = myTiebreaker.place_in_week;
		let aheadOfMe = 0,
				tiedMe = 0,
				behindMe = 0;
		myUser.tied = (myTiebreaker.tied_flag ? 'T' : '');
		data.sort(sortForDash.bind(null, sort.points_earned, sort.games_correct)).forEach(u => {
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
		highestScore,
		isOverall: false,
		myTiebreaker,
		myUser,
		pageReady: picksReady && tiebreakerReady && tiebreakersReady && usersReady,
		sort,
		week,
		_changeSortBy
	};
}, DashLayout);
