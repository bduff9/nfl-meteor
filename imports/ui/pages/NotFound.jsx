import React from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

import { writeLog } from '../../api/collections/nfllogs';
import { displayError } from '../../api/global';

export const NotFound = ({ location }) => {
  const imgs = ['rivers.jpg'];

  writeLog.call({ userId: Meteor.userId(), action: '404', message: location.pathname }, displayError);

  const _get404Image = () => {
    const img = imgs[Math.floor(Math.random() * imgs.length)];
    return img;
  };

  return (
    <div className="flex-container">
      <Helmet title="Not Found" />
      <div className="signin-form" style={{width:"600px"}}>
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <h1>What have you done?!</h1>
          </div>
        </div>
        <div className="row">
          <div className="text-xs-center col-xs-12" style={{ marginBottom: '25px' }}>
            <img src={`/404/${_get404Image()}`} alt="404 - Page Not Found" width="500px" />
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
            <Link to="/" activeClassName="active">Please click here to get us both out of this situation</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
