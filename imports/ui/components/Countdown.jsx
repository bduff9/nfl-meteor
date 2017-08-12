'use strict';

import React, { Component, PropTypes } from 'react';
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
		clearInterval(this.timerID);
	}

	tick () {
		const now = new Date();
		this.setState({ now });
	}

	render () {
		const { nextKickoff, week } = this.props,
				{ now } = this.state,
				days = moment(nextKickoff).diff(moment(now), 'days'),
				diff = moment(nextKickoff - now);
		let timeString;
		if (days > 0) {
			timeString = diff.format('D[d] H[h] m[m]');//`${days}d ${hours}h ${minutes}m`;
		} else {
			timeString = diff.format('H[h] m[m] s[s]');//`${hours}h ${minutes}m ${seconds}s`;
		}
		return (
			<span title={`Countdown to start of week ${week}`}>{timeString}</span>
		);
	}
}

Countdown.propTypes = {
	nextKickoff: PropTypes.instanceOf(Date).isRequired,
	week: PropTypes.number.isRequired
};
