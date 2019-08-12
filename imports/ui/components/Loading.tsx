import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FC } from 'react';

const Loading: FC<{}> = (): JSX.Element => (
	<div className="text-center loading">
		Loading...
		<br />
		<FontAwesomeIcon icon="spinner" pulse />
	</div>
);

export default Loading;
