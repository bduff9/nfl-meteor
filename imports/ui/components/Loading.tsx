import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FC, memo } from 'react';

const Loading: FC<{}> = (): JSX.Element => (
	<div className="text-center loading">
		Loading...
		<br />
		<FontAwesomeIcon icon={['fad', 'spinner']} fixedWidth pulse />
	</div>
);

Loading.whyDidYouRender = true;

export default memo(Loading);
