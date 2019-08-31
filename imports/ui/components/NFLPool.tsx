import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC } from 'react';
import Helmet from 'react-helmet';

import Routes from '../../startup/client/Routes';
import Loading from '../pages/Loading';

export type TNFLPoolProps = {
	authenticated: boolean;
	loggingIn: boolean;
	pageReady: boolean;
	userID: string;
};

const NFLPool: FC<TNFLPoolProps> = ({
	authenticated,
	loggingIn,
	pageReady,
	userID,
}): JSX.Element => (
	<div className="row">
		<Helmet
			htmlAttributes={{ lang: 'en', amp: undefined }}
			title="Welcome"
			titleTemplate="%s | NFL Confidence Pool"
			link={[
				{ rel: 'icon', sizes: '16x16 32x32', href: '/football-icon.png?v=1' },
			]}
			meta={[
				{ charSet: 'utf-8' },
				{ httpEquiv: 'X-UA-Compatible', content: 'IE=edge' },
				{
					name: 'viewport',
					content: 'width=device-width, initial-scale=1, user-scalable=no',
				},
				{
					name: 'theme-color',
					content: '#8c8c8c',
				},
			]}
		/>
		{pageReady ? (
			<Routes authenticated={authenticated} key={`current-user-${userID}`} />
		) : (
			<Loading />
		)}
	</div>
);

NFLPool.whyDidYouRender = true;

export default withTracker(
	(): TNFLPoolProps => {
		const systemValsHandle = Meteor.subscribe('systemValues');
		const systemValsReady = systemValsHandle.ready();
		const userHandle = Meteor.subscribe('userData');
		const userReady = userHandle.ready();
		const loggingIn = Meteor.loggingIn();
		const userID = Meteor.userId() || '';

		return {
			authenticated: !loggingIn && !!Meteor.userId(),
			loggingIn,
			pageReady: systemValsReady && userReady,
			userID,
		};
	},
)(NFLPool);
