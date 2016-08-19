import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

export const Logout = () => {
  return (
    <div className="row">
      <Helmet title="Logged Out" />
      <div className="white-box col-xs-11 col-sm-10 col-md-6 col-xl-4 logout-box">
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <h3>You have been successfully logged out</h3>
          </div>
        </div>
        <div className="row">
          <div className="text-xs-center col-xs">
            <Link to="/login">Return to Sign-in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
