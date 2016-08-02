import React from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

export const NotFound = ({}) => {
  const imgs = ['test.jpg', 'test.png'];

  const _get404Image = () => {
    const img = imgs[Math.floor(Math.random() * imgs.length)];
    return img;
  };

  return (
    <div className="flex-container">
      <Helmet title="Not Found" />
      <div className="signin-form">
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <h1>404</h1>
          </div>
        </div>
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <img src={`/404/${_get404Image()}`} alt="404 Error" />
          </div>
        </div>
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <h4>The page you're looking for cannot be found.</h4>
          </div>
        </div>
        <div className="row">
          <div className="text-xs-center col-xs-12">
            <Link to="/" activeClassName="active">Return to Home Page</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
