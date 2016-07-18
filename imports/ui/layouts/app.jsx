import React from 'react';
import { Navigation } from '../components/navigation.jsx';

export const App = (props) => {
  const { children, location } = props,
      logoutOnly = location.pathname.indexOf('create') > -1
  return (
    <div>
      <Navigation logoutOnly={logoutOnly} />
      { children }
    </div>
  );
};
