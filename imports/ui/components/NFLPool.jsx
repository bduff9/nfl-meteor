'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Routes } from '../../startup/client/Routes.jsx';
import { Loading } from '../pages/Loading.jsx';

const NFLPool = ({ pageReady }) => {
	return (
		<div className="row">
			<Helmet
				htmlAttributes={{ lang: 'en', 'amp': undefined }}
				title="Welcome"
				titleTemplate="%s | NFL Confidence Pool"
				link={[{ rel: 'icon', sizes: '16x16 32x32', href: '/football-icon.png?v=1' }]}
				meta={[{ 'charset': 'utf-8' }, { 'http-equiv': 'X-UA-Compatible', 'content': 'IE=edge' }, { 'name': 'viewport', 'content': 'width=device-width, initial-scale=1, user-scalable=no' }]} />
			{pageReady ? <Routes /> : <Loading />}
		</div>
	);
};

NFLPool.propTypes = {
	pageReady: PropTypes.bool.isRequired
};

export default createContainer(() => {
	const userHandle = Meteor.subscribe('userData'),
			userReady = userHandle.ready();
	return {
		pageReady: !Meteor.loggingIn() && userReady,
		user: Meteor.user()
	};
}, NFLPool);
