import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, {
	ComponentType,
	FC,
	lazy,
	Suspense,
	useEffect,
	useState,
} from 'react';
import Helmet from 'react-helmet';
import {
	Route,
	Switch,
	withRouter,
	RouteComponentProps,
} from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';

import { currentWeek } from '../../api/collections/games';
import { getCurrentUser, TUser } from '../../api/collections/users';
import { TRightSlider, TWeek } from '../../api/commonTypes';
import AdminOnly from '../../startup/client/AdminOnly';
import UnfinishedRegistration from '../../startup/client/UnfinishedRegistration';
import Loading from '../pages/Loading';
import Navigation from '../components/Navigation';
import RightSlider from '../components/RightSlider';

const AdminAPICalls = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/AdminAPICalls'),
);
const AdminEmail = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/AdminEmail'),
);
const AdminLogs = lazy(
	(): Promise<{
		default: ComponentType<RouteComponentProps>;
	}> => import('../pages/AdminLogs'),
);
const AdminUsers = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/AdminUsers'),
);
const Dashboard = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/Dashboard'),
);
const EditProfile = lazy(
	(): Promise<{
		default: ComponentType<RouteComponentProps>;
	}> => import('../pages/EditProfile'),
);
const MakePicks = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/MakePicks'),
);
const NotFound = lazy(
	(): Promise<{
		default: ComponentType<RouteComponentProps>;
	}> => import('../../ui/pages/NotFound'),
);
const SetSurvivor = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/SetSurvivor'),
);
const Statistics = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/Statistics'),
);
const ViewAllPicks = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/ViewAllPicks'),
);
const ViewPayments = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/ViewPayments'),
);
const ViewPicks = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/ViewPicks'),
);
const ViewSurvivor = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../pages/ViewSurvivor'),
);

export type AuthedLayoutProps = RouteComponentProps & {
	authenticated: boolean;
	currentUser: TUser;
	currentWeek: TWeek | null;
	loggingIn: boolean;
	selectedWeek: TWeek;
};

const AuthedLayout: FC<AuthedLayoutProps> = (props): JSX.Element => {
	const { currentWeek, ...rest } = props;
	const logoutOnly = location.pathname.indexOf('create') > -1;
	const [openMenu, setOpenMenu] = useState<boolean>(false);
	const [rightSlider, setRightSlider] = useState<TRightSlider>(null);
	const [scoreboardWeek, setScoreboardWeek] = useState<TWeek | null>(
		currentWeek,
	);

	useEffect((): void => {
		setOpenMenu(false);
	}, [props]);

	const toggleMenu = (): void => {
		setOpenMenu(!openMenu);
	};

	const toggleRightSlider = (type: TRightSlider): false => {
		const newType: TRightSlider = type === rightSlider ? null : type;

		if (newType) setOpenMenu(false);

		setRightSlider(newType);

		return false;
	};

	return (
		<div className="col-12 authed-layout-wrapper">
			<div className="row">
				<Helmet title="Welcome" />
				<span
					className="d-md-none d-print-none mobile-menu"
					onClick={toggleMenu}
				>
					<FontAwesomeIcon icon={['fad', 'bars']} size="lg" />
				</span>
				<Navigation
					{...rest}
					currentWeek={currentWeek || 1}
					logoutOnly={logoutOnly}
					openMenu={openMenu}
					toggleMenu={toggleMenu}
					toggleRightSlider={toggleRightSlider}
				/>
				<div className="col-12 col-sm-9 ml-sm-auto ml-print-0 col-lg-10 main">
					<Suspense fallback={<Loading />}>
						<Switch>
							<AdminOnly
								exact
								path="/admin/api"
								component={AdminAPICalls}
								{...props}
							/>
							<AdminOnly
								exact
								path="/admin/email"
								component={AdminEmail}
								{...props}
							/>
							<AdminOnly
								exact
								path="/admin/logs"
								component={AdminLogs}
								{...props}
							/>
							<AdminOnly
								exact
								path="/admin/users"
								component={AdminUsers}
								{...props}
							/>
							<Route exact path="/picks/set" component={MakePicks} {...props} />
							<Route
								exact
								path="/picks/view"
								component={ViewPicks}
								{...props}
							/>
							<Route
								exact
								path="/picks/viewall"
								component={ViewAllPicks}
								{...props}
							/>
							<Route
								exact
								path="/users/stats"
								component={Statistics}
								{...props}
							/>
							<Route
								exact
								path="/survivor/set"
								component={SetSurvivor}
								{...props}
							/>
							<Route
								exact
								path="/survivor/view"
								component={ViewSurvivor}
								{...props}
							/>
							<UnfinishedRegistration
								exact
								path="/users/create"
								component={EditProfile}
								{...props}
							/>
							<Route
								exact
								path="/users/edit"
								component={EditProfile}
								{...props}
							/>
							<Route
								exact
								path="/users/payments"
								component={ViewPayments}
								{...props}
							/>
							<Route exact path="/" component={Dashboard} />
							<Route component={NotFound} {...props} />
						</Switch>
					</Suspense>
				</div>
			</div>
			<CSSTransition
				in={!!rightSlider}
				classNames="right-slider"
				timeout={1000}
			>
				{rightSlider ? (
					<RightSlider
						type={rightSlider}
						week={scoreboardWeek || currentWeek || 1}
						setScoreboardWeek={setScoreboardWeek}
						toggleRightSlider={toggleRightSlider}
						key={`right-slider-${rightSlider}`}
					/>
				) : (
					<></>
				)}
			</CSSTransition>
		</div>
	);
};

AuthedLayout.whyDidYouRender = true;

export default withRouter(
	withTracker<AuthedLayoutProps, RouteComponentProps>(
		(props): AuthedLayoutProps => {
			const loggingIn = Meteor.loggingIn();
			const authenticated = !loggingIn && !!Meteor.userId();
			const currentUser: TUser = getCurrentUser.call({});
			const nextGameHandle = Meteor.subscribe('nextGame');
			const nextGameReady = nextGameHandle.ready();
			let selectedWeek = Session.get('selectedWeek');
			let week: TWeek | null = null;

			if (nextGameReady) {
				week = currentWeek.call({});
				selectedWeek = currentUser.getSelectedWeek() || week;
				Session.set('currentWeek', week);
				Session.setDefault('selectedWeek', selectedWeek);
			}

			return {
				...props,
				authenticated,
				currentUser,
				currentWeek: week,
				loggingIn,
				selectedWeek,
			};
		},
	)(AuthedLayout),
);
