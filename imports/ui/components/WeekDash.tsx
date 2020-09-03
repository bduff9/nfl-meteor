import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import { getAllPicksForWeek, TPick } from '../../api/collections/picks';
import {
	getAllTiebreakersForWeek,
	getTiebreaker,
	TTiebreaker,
} from '../../api/collections/tiebreakers';
import { getCurrentUser } from '../../api/collections/users';
import { TWeek } from '../../api/commonTypes';
import { sortForDash } from '../../api/global';
import DashLayout, {
	TDashLayoutProps,
	TDashboardCurrentUser,
	TDashboardUser,
} from '../layouts/DashLayout';
import { TDashSortBy } from '../pages/Dashboard';

export type TWeekDashProps = {
	changeSortBy: (currSort: TDashSortBy, col: string) => void;
	league: string;
	sortBy: TDashSortBy | null;
	week: TWeek;
};

export default withTracker<TDashLayoutProps, TWeekDashProps>(
	({ changeSortBy, league, sortBy, week }): TDashLayoutProps => {
		const myUser: TDashboardCurrentUser = getCurrentUser.call({});
		const tiebreakerHandle = Meteor.subscribe(
			'singleTiebreakerForUser',
			week,
			league,
		);
		const tiebreakerReady = tiebreakerHandle.ready();
		const picksHandle = Meteor.subscribe('allPicksForWeek', week, league);
		const picksReady = picksHandle.ready();
		const tiebreakersHandle = Meteor.subscribe(
			'allTiebreakersForWeek',
			week,
			league,
		);
		const tiebreakersReady = tiebreakersHandle.ready();
		const usersHandle = Meteor.subscribe('basicUsersInfo');
		const usersReady = usersHandle.ready();
		const pageReady =
			picksReady && tiebreakerReady && tiebreakersReady && usersReady;
		const sort: TDashSortBy = sortBy || {
			// eslint-disable-next-line @typescript-eslint/camelcase
			by_place: -1,
		};
		let myTiebreaker: TTiebreaker = {} as any;
		let tiebreakers: TTiebreaker[] = [];
		let picks: TPick[] = [];
		let myPicks: TPick[] = [];
		let highestScore = 0;
		let data: TDashboardUser[] = [];

		if (pageReady) {
			picks = getAllPicksForWeek.call({ league, week });
			myPicks = picks.filter((pick): boolean => pick.user_id === myUser._id);
			myTiebreaker = getTiebreaker.call({ league, week });
			tiebreakers = getAllTiebreakersForWeek.call({ league, week });
			data = tiebreakers.map(
				(tb): TDashboardUser => {
					const tiebreaker = Object.assign({}, tb);
					const user = tb.getUser();
					const userPicks = picks.filter(
						(pick): boolean => pick.user_id === user._id,
					);
					const formattedPlace = tiebreaker.place_in_week
						? tiebreaker.tied_flag
							? `T${tiebreaker.place_in_week}`
							: `${tiebreaker.place_in_week}`
						: 'T1';
					const hasSubmitted = myTiebreaker.submitted;

					highestScore = Math.max(highestScore, tiebreaker.points_earned);

					// eslint-disable-next-line @typescript-eslint/camelcase
					if (!hasSubmitted) tiebreaker.last_score = null;

					return {
						_id: user._id as string,
						// eslint-disable-next-line @typescript-eslint/camelcase
						first_name: user.first_name,
						// eslint-disable-next-line @typescript-eslint/camelcase
						last_name: user.last_name,
						// eslint-disable-next-line @typescript-eslint/camelcase
						team_name: user.team_name,
						place: tiebreaker.place_in_week || 1,
						formattedPlace,
						// eslint-disable-next-line @typescript-eslint/camelcase
						possible_games: userPicks.reduce((prev, pick): number => {
							if (pick.week !== week) return prev;

							if (
								pick.pick_id === pick.winner_id ||
								(pick.pick_id && !pick.winner_id)
							) {
								return prev + 1;
							}

							return prev;
						}, 0),
						// eslint-disable-next-line @typescript-eslint/camelcase
						possible_points: userPicks.reduce((prev, pick): number => {
							if (pick.week !== week) return prev;

							if (
								pick.pick_id === pick.winner_id ||
								(pick.pick_id && !pick.winner_id)
							) {
								return prev + (pick.points || 0);
							}

							return prev;
						}, 0),
						tiebreaker,
						// eslint-disable-next-line @typescript-eslint/camelcase
						total_games: tiebreaker.games_correct,
						// eslint-disable-next-line @typescript-eslint/camelcase
						total_points: tiebreaker.points_earned,
					};
				},
			);
			myUser.correctPicks = myTiebreaker.games_correct;
			const incorrectPicks = myPicks.filter(
				(pick): boolean => !!pick.winner_id && pick.pick_id !== pick.winner_id,
			);

			myUser.incorrectPicks = incorrectPicks.length;
			myUser.correctPoints = myTiebreaker.points_earned;
			myUser.incorrectPoints = incorrectPicks.reduce((prev, pick): number => {
				if (pick.points) return prev + pick.points;

				return prev;
			}, 0);
			myUser.myPlace = myTiebreaker.place_in_week || 1;
			let aheadOfMe = 0;
			let tiedMe = 0;
			let behindMe = 0;

			myUser.tied = myTiebreaker.tied_flag ? 'T' : '';
			data
				.sort(
					sortForDash.bind(
						null,
						sort.by_place,
						sort.points_earned,
						sort.games_correct,
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
			highestScore,
			isOverall: false,
			myTiebreaker,
			myUser,
			pageReady,
			sort,
			week,
		};
	},
)(DashLayout);
