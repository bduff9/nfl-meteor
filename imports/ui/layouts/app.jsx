import React from 'react';
import { Navigation } from '../components/navigation.jsx';

//TODO rename to AuthedLayout and make container
//TODO Change to component
//TODO subscribe on mount, unsub on unmount
//TODO see if this fixes issue with sign out and then sign in and refresh and live data update with current and selected week
export const App = (props) => {
  const { children, location } = props,
      logoutOnly = location.pathname.indexOf('create') > -1;
  return (
    <div>
      <Navigation logoutOnly={logoutOnly} />
      {children}
    </div>
  );
};
