import { Meteor } from 'meteor/meteor';
import React, { FC, useEffect } from 'react';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import Helmet from 'react-helmet';

import { writeLog } from '../../api/collections/nfllogs';
import { handleError } from '../../api/global';

const imgs = [
	'rivers.jpg',
	'bigben.png',
	'cutler.jpg',
	'goodell.jpg',
	'manziel.jpg',
	'peterson.jpg',
	'ref.jpg',
	'rodgers.jpg',
	'sherman.jpg',
];

const get404Image = (): string => imgs[Math.floor(Math.random() * imgs.length)];

const NotFound: FC<RouteComponentProps> = ({ location }): JSX.Element => {
	useEffect((): void => {
		writeLog.call(
			{ userId: Meteor.userId(), action: '404', message: location.pathname },
			handleError,
		);
	}, [location.pathname]);

	return (
		<div className="col not-found-wrapper">
			<Helmet title="Not Found" />
			<div className="white-box col-12 col-sm-10 col-md-8 col-xl-6">
				<div className="row">
					<div className="text-center col-12">
						<h1>What have you done?!</h1>
					</div>
				</div>
				<div className="row">
					<div className="text-center col-12" style={{ marginBottom: '25px' }}>
						<img
							src={`/404/${get404Image()}`}
							alt="Okay, this part was us."
							className="not-found-img"
						/>
					</div>
				</div>
				<div className="row">
					<div className="text-center col-12">
						<h4>
							Something has gone wrong. It might be because of you. It might be
							because of us. Either way, this is awkward.
						</h4>
					</div>
				</div>
				<div className="row">
					<div className="text-center col-12">
						<NavLink to="/">
							Please click here to get us both out of this situation
						</NavLink>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NotFound;
