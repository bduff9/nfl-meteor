import React, { FC, useState } from 'react';

import { TWeek } from '../../api/commonTypes';
import { getTimeDifferenceObject } from '../../api/global';
import { useInterval } from '../../api/hooks';

export type TCountdownProps = {
	nextKickoff: Date;
	week: TWeek;
};

const Countdown: FC<TCountdownProps> = ({ nextKickoff, week }): JSX.Element => {
	const [now, setNow] = useState<Date>(new Date());

	useInterval((): void => {
		setNow(new Date());
	}, 1000);

	const durationData = getTimeDifferenceObject(nextKickoff, now);
	const { days, hours, minutes, seconds, totalSeconds } = durationData;
	let timeString;

	if (totalSeconds <= 0)
		return <span title-="View Live Games">NFL Scoreboard</span>;

	if (days > 0) {
		timeString = `${days}d ${hours}h ${minutes}m`;
	} else if (totalSeconds > 0) {
		timeString = `${hours}h ${minutes}m ${seconds}s`;
	}

	return <span title={`Countdown to start of week ${week}`}>{timeString}</span>;
};

Countdown.whyDidYouRender = true;

export default Countdown;
