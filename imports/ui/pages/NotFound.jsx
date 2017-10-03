'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

import { writeLog } from '../../api/collections/nfllogs';
import { handleError } from '../../api/global';

export const imgs = ['rivers.jpg', 'bigben.png', 'cutler.jpg', 'goodell.jpg', 'manziel.jpg', 'peterson.jpg', 'ref.jpg', 'rodgers.jpg', 'sherman.jpg'];

export const _get404Image = () => {
	const img = imgs[Math.floor(Math.random() * imgs.length)];
	return img;
};

export const NotFound = ({ location }) => {

	writeLog.call({ userId: Meteor.userId(), action: '404', message: location.pathname }, handleError);

	return (
		<div className="col-xs not-found-wrapper">
			<Helmet title="Not Found" />
			<div className="white-box col-xs-12 col-sm-10 col-md-8 col-xl-6">
				<div className="row">
					<div className="text-xs-center col-xs-12">
						<h1>What have you done?!</h1>
					</div>
				</div>
				<div className="row">
					<div className="text-xs-center col-xs-12" style={{ marginBottom: '25px' }}>
						<img src={`/404/${_get404Image()}`} alt="Okay, this part was us." className="not-found-img" />
					</div>
				</div>
				<div className="row">
					<div className="text-xs-center col-xs-12">
						<h4>Something has gone wrong. It might be because of you. It might be because of us.
						Either way, this is awkward.</h4>
					</div>
				</div>
				<div className="row">
					<div className="text-xs-center col-xs-12">
						<Link to="/">Please click here to get us both out of this situation</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

NotFound.propTypes = {
	location: PropTypes.object.isRequired
};
