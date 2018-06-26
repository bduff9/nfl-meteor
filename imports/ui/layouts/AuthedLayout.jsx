'use strict';

import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Session } from 'meteor/session';
import { withTracker } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { currentWeek } from '../../api/collections/games';
import { getCurrentUser } from '../../api/collections/users';
import AdminLogs from '../pages/AdminLogs';
import AdminOnly from '../../startup/client/AdminOnly';
import AdminUsers from '../pages/AdminUsers';
import Dashboard from '../pages/Dashboard';
import EditProfile from '../pages/EditProfile';
import MakePicks from '../pages/MakePicks';
import Navigation from '../components/Navigation.jsx';
import NotFound from '../../ui/pages/NotFound';
import RightSlider from '../components/RightSlider.jsx';
import SetSurvivor from '../pages/SetSurvivor';
import Statistics from '../pages/Statistics';
import UnfinishedRegistration from '../../startup/client/UnfinishedRegistration';
import ViewAllPicks from '../pages/ViewAllPicks';
import ViewPayments from '../pages/ViewPayments';
import ViewPicks from '../pages/ViewPicks';
import ViewSurvivor from '../pages/ViewSurvivor';

class AuthedLayout extends Component {
	constructor (props) {
		super(props);
		this.state = {
			openMenu: false,
			rightSlider: '',
			scoreboardWeek: props.currentWeek
		};
		this._changeScoreboardWeek = this._changeScoreboardWeek.bind(this);
		this._toggleMenu = this._toggleMenu.bind(this);
		this._toggleRightSlider = this._toggleRightSlider.bind(this);
	}

	componentWillReceiveProps (nextProps) {
		this.setState({ openMenu: false });
	}

	_changeScoreboardWeek (newWeek, ev) {
		this.setState({ scoreboardWeek: newWeek });
	}
	_toggleMenu (ev) {
		const { openMenu } = this.state;
		this.setState({ openMenu: !openMenu });
	}
	_toggleRightSlider (type, ev) {
		const { openMenu, rightSlider } = this.state;
		let newType = (type === rightSlider ? '' : type);
		ev.preventDefault();
		this.setState({ openMenu: (newType ? false : openMenu), rightSlider: newType });
		return false;
	}

	render () {
		const { openMenu, rightSlider, scoreboardWeek } = this.state,
				{ currentWeek, location, ...rest } = this.props,
				logoutOnly = location.pathname.indexOf('create') > -1;
		console.log('AuthedLayout');
		return (
			<div className="col-12 authed-layout-wrapper">
				<div className="row">
					<Helmet title="Welcome" />
					<i className="fa fa-lg fa-bars d-sm-none mobile-menu" onClick={this._toggleMenu} />
					<Navigation {...rest}
						currentWeek={currentWeek}
						logoutOnly={logoutOnly}
						openMenu={openMenu}
						rightSlider={rightSlider}
						_toggleMenu={this._toggleMenu}
						_toggleRightSlider={this._toggleRightSlider} />
					<div className="col-12 col-sm-9 ml-sm-auto col-lg-10 main">
						<Switch>
							<AdminOnly exact path="/admin/logs" component={AdminLogs} {...this.props} />
							<AdminOnly exact path="/admin/users" component={AdminUsers} {...this.props} />
							<Route exact path="/picks/set" component={MakePicks}  {...this.props}/>
							<Route exact path="/picks/view" component={ViewPicks} {...this.props} />
							<Route exact path="/picks/viewall" component={ViewAllPicks} {...this.props} />
							<Route exact path="/users/stats" component={Statistics} {...this.props} />
							<Route exact path="/survivor/set" component={SetSurvivor} {...this.props} />
							<Route exact path="/survivor/view" component={ViewSurvivor} {...this.props} />
							<UnfinishedRegistration exact path="/users/create" component={EditProfile} {...this.props} />
							<Route exact path="/users/edit" component={EditProfile} {...this.props} />
							<Route exact path="/users/payments" component={ViewPayments} {...this.props} />
							<Route exact path="/" component={Dashboard} />
							<Route component={NotFound} {...this.props} />
						</Switch>
					</div>
				</div>
				<ReactCSSTransitionGroup transitionName="right-slider" transitionEnterTimeout={1000} transitionLeaveTimeout={1000}>
					{rightSlider ? (
						<RightSlider
							type={rightSlider}
							week={scoreboardWeek || currentWeek}
							_changeScoreboardWeek={this._changeScoreboardWeek}
							_toggleRightSlider={this._toggleRightSlider} key={'right-slider-' + rightSlider} />
					)
						:
						null
					}
				</ReactCSSTransitionGroup>
			</div>
		);
	}
}

AuthedLayout.propTypes = {
	currentUser: PropTypes.object.isRequired,
	currentWeek: PropTypes.number,
	location: PropTypes.object.isRequired,
	selectedWeek: PropTypes.number
};

export default withTracker(() => {
	const currentUser = getCurrentUser.call({}),
			nextGameHandle = Meteor.subscribe('nextGame'),
			nextGameReady = nextGameHandle.ready();
	let selectedWeek = Session.get('selectedWeek'),
			week;
	if (nextGameReady) {
		week = currentWeek.call({});
		selectedWeek = currentUser.getSelectedWeek() || week;
		Session.set('currentWeek', week);
		Session.setDefault('selectedWeek', selectedWeek);
	}
	return {
		currentUser,
		currentWeek: week,
		selectedWeek
	};
})(AuthedLayout);
