'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';

export default class Tooltip extends Component {
	constructor (props) {
		super();
		this.state = {};
	}

	componentDidMount () {
		$(this.tooltipIcon).tooltip();
	}
	componentWillUnmount () {
		$(this.tooltipIcon).tooltip('dispose');
	}

	render () {
		const { icon, isHtml, message, placement } = this.props,
				iconClass = icon || 'fa-question-circle',
				tooltipPlacement = placement || 'top';
		return (
			<i className={`fa fa-fw ${iconClass}`} data-toggle="tooltip" data-placement={tooltipPlacement} title={message} data-html={isHtml} ref={i => { this.tooltipIcon = i; }}></i>
		);
	}
}

Tooltip.propTypes = {
	icon: PropTypes.string,
	isHtml: PropTypes.bool,
	message: PropTypes.string.isRequired,
	placement: PropTypes.string
};
