import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

export const Logout = (props) => {
  return (
    <div className="flex-container">
      <Helmet title="Logout" />
      <div className="signin-form">
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <h3>You have been successfully logged out</h3>
          </div>
        </div>
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <Link to="/login" activeClassName="active">Return to Sign-in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
