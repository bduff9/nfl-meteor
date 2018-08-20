'use strict';

import React, { Component, PropTypes } from 'react';
import { moment } from 'meteor/momentjs:moment';

export default class Countdown extends Component {
	constructor (props) {
		super(props);

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
		const { nextKickoff, week } = this.props;
		const { now } = this.state;
		const diff = moment(nextKickoff).diff(now);
		const duration = moment.duration(diff);
		const { days, hours, minutes, seconds } = duration._data;
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
