'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { DEFAULT_LEAGUE } from '../../api/constants';

class Statistics extends Component {
	constructor (props) {
		super();
		this.state = {};
	}

	render () {
		const { pageReady } = this.props,
				pageTitle = 'Pool Stats';
		return (
			<div className="row statistics-wrapper">
				<Helmet title={pageTitle} />
				<h3 className="title-text text-xs-center text-md-left hidden-md-up">{pageTitle}</h3>
				{pageReady ? (
					<div className="col-xs-12 statistics">TODO:</div>
				)
					:
					null
				}
			</div>
		);
	}
}

Statistics.propTypes = {
	currentLeague: PropTypes.string.isRequired,
	pageReady: PropTypes.bool.isRequired,
	selectedWeek: PropTypes.number
};

export default createContainer(() => {
	const selectedWeek = Session.get('selectedWeek'),
			currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'); //TODO: Eventually will need to uncomment this and allow them to change current league
			//TODO: subscribe to all users and pool history years
	return {
		currentLeague,
		pageReady: !!selectedWeek,
		selectedWeek
	};
}, Statistics);
