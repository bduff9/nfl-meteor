import React from 'react';
import Helmet from 'react-helmet';

export const Loading = (props) => {
  return (
    <div className="flex-container">
      <Helmet title="Loading..." />
      <div className="signin-form">
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <i className="fa fa-spinner fa-pulse" /> Loading...
          </div>
        </div>
      </div>
    </div>
  );
};
