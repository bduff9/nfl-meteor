import React from 'react';
import Helmet from 'react-helmet';

export const Loading = (props) => {
  return (
    <div>
      <Helmet title="Loading..." />
      <i className="fa fa-spinner fa-pulse" />
    </div>
  );
};