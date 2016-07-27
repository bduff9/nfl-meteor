import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

export const Logout = (props) => {
  return (
    <div>
      <Helmet title="Logout" />
      <h3>You have been successfully logged out</h3>
      <Link to="/login" activeClassName="active">Return to Sign-in</Link>
    </div>
  );
};