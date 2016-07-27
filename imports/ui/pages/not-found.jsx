import React from 'react';
import Helmet from 'react-helmet';

export const NotFound = (props) => {
  return (
    <div>
      <Helmet title="Not Found" />
      <h3>404 - Not Found</h3>
    </div>
  );
};