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
		const { nextKickoff } = this.props,
				{ now } = this.state,
				days = moment(nextKickoff).diff(moment(now), 'days'),
				hours = moment(nextKickoff).diff(moment(now), 'hours'),
				minutes = moment(nextKickoff).diff(moment(now), 'minutes'),
				seconds = moment(nextKickoff).diff(moment(now), 'seconds');
		let timeString;
		if (days > 0) {
			timeString = `${days}d ${hours}h ${minutes}m`;
		} else {
			timeString = `${hours}h ${minutes}m ${seconds}s`;
		}
		return (
			<span>{timeString}</span>
		);
	}
}

Countdown.propTypes = {
	nextKickoff: PropTypes.instanceOf(Date).isRequired
};
