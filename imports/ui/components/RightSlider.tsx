import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FC } from 'react';

import { TRightSlider, TWeek } from '../../api/commonTypes';

import Messages from './Messages';
import { Rules } from './Rules';
import ScoreBoard from './ScoreBoard';

type RightSliderProps = {
	setScoreboardWeek: (n: TWeek) => void;
	toggleRightSlider: (s: TRightSlider) => void;
	type: TRightSlider;
	week: TWeek;
};

const RightSlider: FC<RightSliderProps> = ({
	setScoreboardWeek,
	toggleRightSlider,
	type,
	week,
}): JSX.Element => {
	const getSliderContent = (): JSX.Element => {
		switch (type) {
			case 'messages':
				return <Messages />;
			case 'rules':
				return <Rules />;
			case 'scoreboard':
				return (
					<ScoreBoard week={week} changeScoreboardWeek={setScoreboardWeek} />
				);
			default:
				console.error('Invalid slider type chosen', type);

				return <></>;
		}
	};

	const closeRightSlider = (): void => {
		toggleRightSlider(null);
	};

	return (
		<div className="col-12 col-sm-5 col-md-4 right-slider">
			<span className="close-slider" onClick={closeRightSlider}>
				<FontAwesomeIcon icon="times" fixedWidth />
			</span>
			{getSliderContent()}
		</div>
	);
};

export default RightSlider;
