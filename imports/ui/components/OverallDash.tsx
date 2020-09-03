import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { getAllPicks, TPick } from '../../api/collections/picks';
import { getCurrentUser, getUsers, TUser } from '../../api/collections/users';
import { NO_MISS_WEEK } from '../../api/constants';
import { sortForDash } from '../../api/global';
import DashLayout, {
	TDashLayoutProps,
	TDashboardUser,
	TDashboardCurrentUser,
} from '../layouts/DashLayout';
import { TDashSortBy } from '../pages/Dashboard';

export type TOverallDashProps = {
	changeSortBy: (currSort: TDashSortBy, col: string) => void;
	league: string;
	sortBy: TDashSortBy | null;
};

export default withTracker<TDashLayoutProps, TOverallDashProps>(
	({ changeSortBy, league, sortBy }): TDashLayoutProps => {
		const myUser: TDashboardCurrentUser = getCurrentUser.call({});
		const picksHandle = Meteor.subscribe('allPicks', league);
		const picksReady = picksHandle.ready();
		const usersHandle = Meteor.subscribe('overallPlaces');
		const usersReady = usersHandle.ready();
		// eslint-disable-next-line @typescript-eslint/camelcase
		const sort = sortBy || { by_place: -1 };
		let picks: TPick[] = [];
		let myPicks: TPick[] = [];
		let users: TUser[] = [];
		let data: TDashboardUser[] = [];

		if (picksReady && usersReady) {
			picks = getAllPicks.call({ league });
			myPicks = picks.filter((pick): boolean => pick.user_id === myUser._id);
			users = getUsers.call({ activeOnly: true, league });
			data = users.map(
				(u): TDashboardUser => {
					const missedGames = picks.filter(
						(pick): boolean => {
							if (pick.week < NO_MISS_WEEK) return false;

							if (pick.user_id !== u._id) return false;

							return !!pick.winner_id && !pick.pick_id;
						},
					);

					return {
						_id: u._id || '',
						// eslint-disable-next-line @typescript-eslint/camelcase
						first_name: u.first_name,
						// eslint-disable-next-line @typescript-eslint/camelcase
						last_name: u.last_name,
						// eslint-disable-next-line @typescript-eslint/camelcase
						team_name: u.team_name,
						// eslint-disable-next-line @typescript-eslint/camelcase
						missed_games: missedGames.length > 0 ? 'Y' : '',
						place: u.overall_place || 1,
						// eslint-disable-next-line @typescript-eslint/camelcase
						formattedPlace: u.overall_place
							? u.overall_tied_flag
								? `T${u.overall_place}`
								: `${u.overall_place}`
							: 'T1',
						// eslint-disable-next-line @typescript-eslint/camelcase
						total_games: u.total_games,
						// eslint-disable-next-line @typescript-eslint/camelcase
						total_points: u.total_points,
						// eslint-disable-next-line @typescript-eslint/camelcase
						overall_place: u.overall_place,
						// eslint-disable-next-line @typescript-eslint/camelcase
						overall_tied_flag: u.overall_tied_flag,
					};
				},
			);
			const correctPicks = myPicks.filter(
				(pick): boolean => !!pick.winner_id && pick.pick_id === pick.winner_id,
			);

			myUser.correctPicks = correctPicks.length;

			const incorrectPicks = myPicks.filter(
				(pick): boolean => !!pick.winner_id && pick.pick_id !== pick.winner_id,
			);

			myUser.incorrectPicks = incorrectPicks.length;
			myUser.correctPoints = correctPicks.reduce((prev, pick): number => {
				if (pick.points) return prev + pick.points;

				return prev;
			}, 0);
			myUser.incorrectPoints = incorrectPicks.reduce((prev, pick): number => {
				if (pick.points) return prev + pick.points;

				return prev;
			}, 0);
			myUser.myPlace = myUser.overall_place || 1;

			let aheadOfMe = 0;
			let tiedMe = 0;
			let behindMe = 0;

			myUser.tied = myUser.overall_tied_flag ? 'T' : '';
			data
				.sort(
					sortForDash.bind(
						null,
						sort.by_place,
						sort.total_points,
						sort.total_games,
					),
				)
				.forEach(
					(u): void => {
						const place = u.place;
						const myPlace = myUser.myPlace;

						if (place < myPlace) aheadOfMe++;

						if (place === myPlace && u._id !== myUser._id) tiedMe++;

						if (place > myPlace) behindMe++;
					},
				);
			myUser.aheadOfMe = aheadOfMe;
			myUser.tiedMe = tiedMe;
			myUser.behindMe = behindMe;
		}

		return {
			changeSortBy,
			data,
			highestScore: 0,
			isOverall: true,
			myUser,
			pageReady: picksReady && usersReady,
			sort,
		};
	},
)(DashLayout);
