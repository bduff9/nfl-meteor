'use strict';

import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { NO_MISS_WEEK } from '../../api/constants';
import { DashLayout } from '../layouts/DashLayout.jsx';
import { User } from '../../api/collections/users';

export default createContainer(({ league, sortBy, _changeSortBy }) => {
	const dataHandle = Meteor.subscribe('overallPlaces'),
			dataReady = dataHandle.ready();
	let sort = sortBy || { total_points: -1, total_games: -1 },
			data = [];
	if (dataReady) {
		//TODO: make this into method
		data = User.find({ done_registering: true }, { sort }).fetch()
			.map((u, i, allUsers) => {
				const missedGames = u.picks.filter(pick => pick.week >= NO_MISS_WEEK && pick.winner_id && !pick.pick_id);
				return {
					_id: u._id,
					first_name: u.first_name,
					last_name: u.last_name,
					team_name: u.team_name,
					missed_games: (missedGames.length > 0 ? 'Y' : ''),
					place: (u.overall_place ? (u.overall_tied_flag ? `T${u.overall_place}` : u.overall_place) : 'T1'),
					total_games: u.total_games,
					total_points: u.total_points,
					overall_place: u.overall_place,
					overall_tied_flag: u.overall_tied_flag
				};
			});
	}
	return {
		data,
		dataReady,
		isOverall: true,
		picks, //TODO: populate this for dashlayout with all picks
		sort,
		tiebreaker, //TODO: populate this for currentuser
		_changeSortBy
	};
}, DashLayout);
