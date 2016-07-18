import React, { PropTypes } from 'react';
import { Link } from 'react-router';

export const Logout = (props) => {
  return (
    <div>
      <h3>Logout</h3>
      <Link to="/login" activeClassName="active">Return to Sign-in</Link>
    </div>
  );
};