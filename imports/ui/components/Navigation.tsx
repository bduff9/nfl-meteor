import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC, MouseEvent } from 'react';
import { NavLink } from 'react-router-dom';
import sweetAlert from 'sweetalert';

import { getNextGame, TGame } from '../../api/collections/games';
import {
	getUnreadMessages,
	TNFLLog,
	writeLog,
} from '../../api/collections/nfllogs';
import {
	getMySurvivorPicks,
	TSurvivorPick,
} from '../../api/collections/survivorpicks';
import { getSystemValues, TSystemVals } from '../../api/collections/systemvals';
import { getTiebreaker, TTiebreaker } from '../../api/collections/tiebreakers';
import {
	updateSelectedWeek,
	updateUserSurvivor,
	TUser,
} from '../../api/collections/users';
import { TWeek, TRightSlider } from '../../api/commonTypes';
import {
	DEFAULT_LEAGUE,
	SLACK_INVITE_URL,
	SURVIVOR_COST,
	ALL_WEEKS,
} from '../../api/constants';
import {
	formatDate,
	handleError,
	getCurrentSeasonYear,
} from '../../api/global';

import Countdown from './Countdown';

const initPool = (ev: MouseEvent): false => {
	ev.preventDefault();

	if (
		confirm(
			`Are you sure you want to do this?  All data will be reset for the ${getCurrentSeasonYear()} season`,
		)
	) {
		Meteor.call(
			'initPoolOnServer',
			{},
			(err: Meteor.Error): void | Promise<boolean> => {
				if (err) return handleError(err);

				Meteor.logout();
			},
		);
	}

	return false;
};

const refreshGames = (ev: MouseEvent): false => {
	ev.preventDefault();
	Meteor.call('Games.refreshGameData', {}, handleError);

	return false;
};

const selectWeek = (newWeek: TWeek): false => {
	if (newWeek > 0 && newWeek < 18)
		updateSelectedWeek.call({ week: newWeek }, handleError);

	return false;
};

const confirmGoToSlack = (): false => {
	sweetAlert({
		title: 'Open Slack?',
		text:
			"Chat/Support is handled in a 3rd party website named Slack.  The first time you do this, you will need to register for Slack to participate.\n\nNote: Slack will open in a new window/tab, so you will not lose anything in the pool.\n\nPress 'OK' to open a new window/tab for Slack or 'Cancel' to stay on the current page.",
		icon: 'info',
		buttons: { cancel: true, confirm: true },
	}).then(
		(result: true | null): void => {
			if (!result) return;

			const slackWin = window.open(SLACK_INVITE_URL, '_slack');
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			const user: TUser | null = Meteor.user();

			if (user)
				writeLog.call(
					{
						action: 'SLACK',
						message: `${user.first_name} ${user.last_name} navigated to Slack`,
						userId: user._id,
					},
					handleError,
				);

			if (slackWin) slackWin.focus();
		},
	);

	return false;
};

export type TNavigationProps = {
	currentUser: TUser;
	currentWeek: TWeek;
	logoutOnly: boolean;
	openMenu: boolean;
	selectedWeek: TWeek;
	toggleMenu: () => void;
	toggleRightSlider: (r: TRightSlider) => false;
};

export type TNavigationDataProps = TNavigationProps & {
	currentWeekTiebreaker: TTiebreaker | null;
	nextGame: TGame | null;
	pageReady: boolean;
	survivorPicks: TSurvivorPick[];
	systemVals: TSystemVals;
	tiebreaker: TTiebreaker | null;
	unreadMessages: TNFLLog[];
};

const Navigation: FC<TNavigationDataProps> = ({
	currentUser,
	currentWeek,
	currentWeekTiebreaker,
	logoutOnly,
	nextGame,
	openMenu,
	pageReady,
	selectedWeek,
	survivorPicks,
	systemVals,
	tiebreaker,
	unreadMessages,
	toggleMenu,
	toggleRightSlider,
}): JSX.Element => {
	const showCountdown = nextGame && nextGame.game === 1;
	const hasSeasonStarted = nextGame && (nextGame.week > 1 || nextGame.game > 1);
	const seasonStart = nextGame && formatDate(nextGame.kickoff, false);
	let msgCt = unreadMessages.length;

	if (pageReady && !logoutOnly) {
		if (currentUser) msgCt += currentUser.paid ? 0 : 1;

		if (currentWeekTiebreaker)
			msgCt +=
				currentWeekTiebreaker.submitted || (nextGame && nextGame.notFound)
					? 0
					: 1;

		if (currentUser.survivor)
			msgCt +=
				(currentUser.survivor &&
					!survivorPicks.filter((s): boolean => s.week === currentWeek)[0]) ||
				survivorPicks.filter((s): boolean => s.week === currentWeek)[0].pick_id
					? 0
					: 1;
	}

	const confirmSurvivorPool = (): void => {
		sweetAlert({
			title: 'Register for Survivor Pool?',
			text: `Are you sure you want to register for the survivor pool?\n\nParticipating in the survivor pool costs an additional $${SURVIVOR_COST}.  Press 'OK' to join or 'Cancel' to decide later.\n\nNote: You have until the first kickoff (on ${seasonStart}) to register.`,
			icon: 'info',
			buttons: { cancel: true, confirm: { closeModal: false } },
		}).then(
			(result: true | null): void => {
				if (!result) return;

				updateUserSurvivor.call({ survivor: true });
				sweetAlert({
					title: 'Welcome to the Survivor Pool',
					text:
						'You have successfully joined the survivor pool for this season.\n\nPlease be sure to select your pick prior to the first kickoff of each week.',
					icon: 'success',
				});
			},
		);
	};

	const goToCurrentWeek = (): false => selectWeek(currentWeek);

	const goToNextWeek = (): false => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		const nextWeek: TWeek | undefined = ALL_WEEKS[selectedWeek];

		if (nextWeek) return selectWeek(nextWeek);

		return false;
	};

	const goToPreviousWeek = (): false => {
		const previousWeek: TWeek | undefined = ALL_WEEKS[selectedWeek - 2];

		if (previousWeek) return selectWeek(previousWeek);

		return false;
	};

	return (
		<div
			className={`col-10 col-sm-3 col-lg-2 d-md-block${
				openMenu ? '' : ' d-none'
			} d-print-none sidebar`}
		>
			<div className="sidebar-inner">
				<span className="d-sm-none" onClick={toggleMenu}>
					<FontAwesomeIcon className="close-menu" icon={['fad', 'times']} />
				</span>
				{!logoutOnly ? (
					<>
						<ul className="nav nav-sidebar flex-column">
							<li>
								<h5>{`Welcome, ${currentUser.first_name}`}</h5>
							</li>
							<li>
								<NavLink to="/users/edit" exact activeClassName="active">
									Edit My Profile
								</NavLink>
							</li>
							<li>
								<NavLink to="/users/payments" exact activeClassName="active">
									View Payments
								</NavLink>
							</li>
							<li>
								<NavLink
									to={{ pathname: '/logout', state: { isLogout: true } }}
									exact
									activeClassName="active"
								>
									Signout
								</NavLink>
							</li>
						</ul>
						{selectedWeek && (
							<ul className="nav nav-sidebar flex-column">
								<li>
									<span
										className={`${selectedWeek === 1 ? 'disabled' : ''}`}
										onClick={goToPreviousWeek}
									>
										<FontAwesomeIcon icon={['fad', 'caret-left']} fixedWidth />
									</span>
									{` Week ${selectedWeek} `}
									<span
										className={`${selectedWeek === 17 ? 'disabled' : ''}`}
										onClick={goToNextWeek}
									>
										<FontAwesomeIcon icon={['fad', 'caret-right']} fixedWidth />
									</span>
								</li>
								{currentWeek !== selectedWeek && (
									<li>
										<a href="#" onClick={goToCurrentWeek}>
											<FontAwesomeIcon icon={['fad', 'reply']} fixedWidth />{' '}
											Current Week
										</a>
									</li>
								)}
							</ul>
						)}
						<ul className="nav nav-sidebar flex-column">
							<li>
								<NavLink to="/" exact activeClassName="active">
									Dashboard
								</NavLink>
							</li>
							<li>
								<NavLink to="/users/stats" exact activeClassName="active">
									Statistics
								</NavLink>
							</li>
							<li>
								<NavLink to="/picks/view" exact activeClassName="active">
									View My Picks
								</NavLink>
							</li>
							{tiebreaker &&
								(selectedWeek >= currentWeek && !tiebreaker.submitted ? (
									<li>
										<NavLink to="/picks/set" exact activeClassName="active">
											Make Picks
										</NavLink>
									</li>
								) : (
									<li>
										<NavLink to="/picks/viewall" exact activeClassName="active">
											View All Picks
										</NavLink>
									</li>
								))}
							{currentUser.survivor ? (
								<>
									{survivorPicks.length === 17 && (
										<li key="make-survivor-picks">
											<NavLink
												to="/survivor/set"
												exact
												activeClassName="active"
											>
												Make Survivor Picks
											</NavLink>
										</li>
									)}
									{nextGame && (nextGame.week > 1 || nextGame.game > 1) && (
										<li key="view-survivor-picks">
											<NavLink
												to="/survivor/view"
												exact
												activeClassName="active"
											>
												View Survivor Picks
											</NavLink>
										</li>
									)}
								</>
							) : hasSeasonStarted ? (
								<li>
									<a href="#" className="disabled-link">
										No Survivor Pool
									</a>
								</li>
							) : (
								<li>
									<button
										className="btn btn-success btn-glowing"
										onClick={confirmSurvivorPool}
									>
										Join Survivor Pool
									</button>
								</li>
							)}
						</ul>
						<ul className="nav nav-sidebar flex-column">
							<li>
								<a
									href="#"
									onClick={(): false => toggleRightSlider('messages')}
								>
									{msgCt > 0 ? <strong>Messages</strong> : 'Messages'}&nbsp;
									{msgCt > 0 && (
										<span
											title={`You have ${msgCt} messages`}
											className="badge badge-pill badge-pulsate badge-danger"
										>
											{msgCt}
										</span>
									)}
								</a>
							</li>
							<li>
								<a href="#" onClick={(): false => toggleRightSlider('rules')}>
									Rules
								</a>
							</li>
							<li>
								<a
									href="#"
									onClick={(): false => toggleRightSlider('scoreboard')}
								>
									{showCountdown && nextGame ? (
										<Countdown
											nextKickoff={nextGame.kickoff}
											week={nextGame.week}
										/>
									) : (
										'NFL Scoreboard'
									)}
								</a>
							</li>
							<li>
								<a href="#" onClick={confirmGoToSlack}>
									Chat/Support
									<FontAwesomeIcon
										className="external-link"
										icon={['fad', 'external-link']}
									/>
								</a>
							</li>
						</ul>
						{currentUser.is_admin && (
							<ul className="nav nav-sidebar flex-column">
								<li>
									<NavLink to="/admin/users" exact activeClassName="active">
										Manage Users
									</NavLink>
								</li>
								<li>
									<NavLink to="/admin/logs" exact activeClassName="active">
										View Logs
									</NavLink>
								</li>
								<li>
									<a href="#" onClick={refreshGames}>
										Refresh Games
									</a>
								</li>
								<li>
									<NavLink to="/admin/email" exact activeClassName="active">
										Email Users
									</NavLink>
								</li>
								<li>
									<NavLink to="/admin/api" exact activeClassName="active">
										Debug API Calls
									</NavLink>
								</li>
								{getCurrentSeasonYear() > systemVals.year_updated && (
									<li>
										<a href="#" onClick={initPool}>
											Init Pool for {getCurrentSeasonYear()} Season
										</a>
									</li>
								)}
							</ul>
						)}
					</>
				) : (
					<ul className="nav nav-sidebar flex-column">
						<li>
							<NavLink
								to={{ pathname: '/logout', state: { isLogout: true } }}
								exact
								activeClassName="active"
							>
								Signout
							</NavLink>
						</li>
					</ul>
				)}
			</div>
		</div>
	);
};

Navigation.whyDidYouRender = true;

export default withTracker(
	({
		currentUser,
		currentWeek,
		logoutOnly,
		selectedWeek,
		...rest
	}: TNavigationProps): TNavigationDataProps => {
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
		const lastChatActionHandle = Meteor.subscribe('lastChatAction');
		const lastChatActionReady = lastChatActionHandle.ready();
		const nextGameHandle = Meteor.subscribe('nextGameToStart');
		const nextGameReady = nextGameHandle.ready();
		const messagesHandle = Meteor.subscribe('unreadMessages');
		const messagesReady = messagesHandle.ready();
		const survivorHandle = Meteor.subscribe('mySurvivorPicks', currentLeague);
		const survivorReady = survivorHandle.ready();
		const tiebreakerHandle = Meteor.subscribe(
			'singleTiebreakerForUser',
			selectedWeek,
			currentLeague,
		);
		const tiebreakerReady = tiebreakerHandle.ready();
		const currentWeekTiebreakerHandle = Meteor.subscribe(
			'singleTiebreakerForUser',
			currentWeek,
			currentLeague,
		);
		const currentWeekTiebreakerReady = currentWeekTiebreakerHandle.ready();
		const systemVals = getSystemValues.call({});
		let nextGame = null;
		let unreadMessages = [];
		let survivorPicks = [];
		let tiebreaker = null;
		let currentWeekTiebreaker = null;

		if (!logoutOnly) {
			if (nextGameReady) nextGame = getNextGame.call({});

			if (messagesReady) unreadMessages = getUnreadMessages.call({});

			if (survivorReady)
				survivorPicks = getMySurvivorPicks.call({ league: currentLeague });

			if (tiebreakerReady)
				tiebreaker = getTiebreaker.call({
					league: currentLeague,
					week: selectedWeek,
				});

			if (currentWeekTiebreakerReady)
				currentWeekTiebreaker = getTiebreaker.call({
					league: currentLeague,
					week: currentWeek,
				});
		}

		return {
			...rest,
			currentUser,
			currentWeek,
			currentWeekTiebreaker,
			logoutOnly,
			nextGame,
			pageReady:
				currentWeekTiebreakerReady &&
				lastChatActionReady &&
				nextGameReady &&
				messagesReady &&
				survivorReady &&
				tiebreakerReady,
			selectedWeek,
			survivorPicks,
			systemVals,
			tiebreaker,
			unreadMessages,
		};
	},
)(Navigation);
