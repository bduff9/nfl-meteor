'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { moment } from 'meteor/momentjs:moment';

export default class Countdown extends Component {
	constructor (props) {
		super();
		this.state = {
			now: new Date()
		};
	}

	componentDidMount () {
		this.timerID = setInterval(() => this.tick(), 1000);
	}

	componentWillUnmount () {
		if (this.timerID) clearInterval(this.timerID);
	}

	tick () {
		const now = new Date();
		this.setState({ now });
	}

	render () {
		const { nextKickoff, week } = this.props,
				{ now } = this.state,
				diff = moment(nextKickoff).diff(now),
				duration = moment.duration(diff),
				{ days, hours, minutes, seconds } = duration._data;
		let timeString;

		if (days > 0) {
			timeString = `${days}d ${hours}h ${minutes}m`;
		} else if (hours + minutes + seconds > 0) {
			timeString = `${hours}h ${minutes}m ${seconds}s`;
		} else {
			timeString = 'NFL Scoreboard';
			if (this.timerID) clearInterval(this.timerID);
		}

		return <span title={`Countdown to start of week ${week}`}>{timeString}</span>;
	}
}

Countdown.propTypes = {
	nextKickoff: PropTypes.instanceOf(Date).isRequired,
	week: PropTypes.number.isRequired
};
