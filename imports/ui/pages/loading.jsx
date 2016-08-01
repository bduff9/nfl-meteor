import React from 'react';
import Helmet from 'react-helmet';

export const Loading = (props) => {
  return (
    <div className="flex-container">
      <Helmet title="Loading..." />
      <div className="signin-form">
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <h3>Loading...  <i className="fa fa-spinner fa-pulse" /></h3>
          </div>
        </div>
      </div>
    </div>
  );
};
