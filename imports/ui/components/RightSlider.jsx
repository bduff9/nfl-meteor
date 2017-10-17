'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import Messages from './Messages.jsx';
import { Rules } from './Rules.jsx';
import ScoreBoard from './ScoreBoard.jsx';
import Chat from './Chat.jsx';

const RightSlider = ({ type, week, _changeScoreboardWeek, _toggleRightSlider }) => {

	const _getSliderContent = () => {
		switch(type) {
			case 'messages':
				return <Messages />;
			case 'rules':
				return <Rules />;
			case 'scoreboard':
				return <ScoreBoard week={week} _changeScoreboardWeek={_changeScoreboardWeek} />;
			case 'chat':
				return <Chat />;
			default:
				console.error('Invalid slider type chosen', type);
				return null;
		}
	};

	return (
		<div className="col-12 col-sm-5 col-md-4 right-slider">
			<i className="fa fa-fw fa-times close-slider" onClick={_toggleRightSlider.bind(null, '')} />
			{_getSliderContent()}
		</div>
	);
};

RightSlider.propTypes = {
	type: PropTypes.string.isRequired,
	week: PropTypes.number,
	_changeScoreboardWeek: PropTypes.func.isRequired,
	_toggleRightSlider: PropTypes.func.isRequired
};

export default RightSlider;
