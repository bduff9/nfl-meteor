import React from 'react';
import { Navigation } from '../components/navigation.jsx';

//TODO rename to AuthedLayout
//TODO Change to component
//TODO subscribe on mount, unsub on unmount
//TODO see if this fixes issue with sign out and then sign in setting selectedWeek to 17
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
