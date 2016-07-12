/*jshint esversion: 6 */
'use strict';

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import { App } from '../../ui/layouts/app.jsx';
import { Dashboard } from '../../ui/pages/dashboard.jsx';
import { Register } from '../../ui/pages/register.jsx';
import Login from '../../ui/pages/login.jsx';
import { Logout } from '../../ui/pages/logout.jsx';
import { MakePicks } from '../../ui/pages/make-picks.jsx';
import { ViewPicks } from '../../ui/pages/view-picks.jsx';
import { ViewAllPicks } from '../../ui/pages/view-all-picks.jsx';
import { SetSurvivor } from '../../ui/pages/set-survivor.jsx';
import { ViewSurvivor } from '../../ui/pages/view-survivor.jsx';
import { CreateProfile } from '../../ui/pages/create-profile.jsx';
import { EditProfile } from '../../ui/pages/edit-profile.jsx';
import { NotFound } from '../../ui/pages/not-found.jsx';

function requireAuth(nextState, replace) {
  if (!Meteor.userId()) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
//TODO how to redirect correctly upon sign in?
    });
  }
}

function requireNoAuth(nextState, replace) {
  if (Meteor.userId()) {
    replace({
      pathname: '/'
    });
  }
}

function validateUser(nextState, replace) {
  const { first_name } = Meteor.user();
console.log(first_name);
  if (first_name == null) {
    replace({
      pathname: '/users/create'
    });
  }
}

function logOut(nextState, replace) {
//TODO this auto redirects to sign in page currently, but is written like it doesn't
//Either fix the redirect or change the code
  if (Meteor.userId()) {
    Meteor.logout();
  } else {
    replace({
      pathname: '/login'
    });
  }
}

export const Routes = () => (
  <Router history={browserHistory}>
    <Route path="/register" component={Register} onEnter={requireNoAuth} />
    <Route path="/login" component={Login} onEnter={requireNoAuth} />
    <Route path="/logout" component={Logout} onEnter={logOut} />
    <Route path="/" component={App} onEnter={requireAuth}>
      <IndexRoute component={Dashboard} onEnter={validateUser} />
      <Route path="/picks" onEnter={validateUser}>
        <Route path="set" component={MakePicks} />
        <Route path="view" component={ViewPicks} />
        <Route path="viewall" component={ViewAllPicks} />
      </Route>
      <Route path="/survivor" onEnter={validateUser}>
        <Route path="set" component={SetSurvivor} />
        <Route path="view" component={ViewSurvivor} />
      </Route>
      <Route path="/users">
        <Route path="create" component={CreateProfile} />
        <Route path="edit" component={EditProfile} onEnter={validateUser} />
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);