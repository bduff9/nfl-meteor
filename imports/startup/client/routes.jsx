/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import { displayError } from '../../api/global';
import { App } from '../../ui/layouts/app.jsx';
import { Dashboard } from '../../ui/pages/dashboard.jsx';
import { Loading } from '../../ui/pages/loading.jsx';
import Login from '../../ui/pages/login.jsx';
import { Logout } from '../../ui/pages/logout.jsx';
import { MakePicks } from '../../ui/pages/make-picks.jsx';
import { ViewPicks } from '../../ui/pages/view-picks.jsx';
import { ViewAllPicks } from '../../ui/pages/view-all-picks.jsx';
import { SetSurvivor } from '../../ui/pages/set-survivor.jsx';
import { ViewSurvivor } from '../../ui/pages/view-survivor.jsx';
import EditProfile from '../../ui/pages/edit-profile.jsx';
import { NotFound } from '../../ui/pages/not-found.jsx';

function requireAuth(nextState, replace) {
  if (!Meteor.userId()) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    });
  }
}

function requireNoAuth(nextState, replace) {
  const { location } = nextState;
  if (Meteor.userId()) {
    if (location.state && location.state.nextPathname) {
      replace({
        pathname: location.state.nextPathname,
        state: { nextPathname: null }
      });
    } else {
      replace({
        pathname: '/'
      });
    }
  }
}

function validateUser(nextState, replace) {
  const { done_registering } = Meteor.user();
  if (!done_registering) {
    replace({
      pathname: '/users/create'
    });
  }
}

function noValidateUser(nextState, replace) {
  const { done_registering } = Meteor.user();
  if (done_registering) {
    replace({
      pathname: '/'
    });
  }
}

function verifyEmail(nextState, replace) {
  const { params } = nextState;
  if (Meteor.userId()) {
    replace({
      pathname: '/'
    });
  } else {
    Accounts.verifyEmail(params.token, (err) => {
      if (err) {
        displayError(err);
      } else {
        Bert.alert('Your email is now verified!', 'success');
        replace({
          pathname: '/users/create'
        });
      }
    });
  }
}

function logOut(nextState, replace) {
  const { location } = nextState;
  if (Meteor.userId()) {
    Meteor.logout();
  } else if (!location.state.isLogout) {
    replace({
      pathname: '/login'
    });
  }
}

export const Routes = () => (
  <Router history={browserHistory}>
    <Route path="/verify-email/:token" component={Loading} onEnter={verifyEmail} />
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
        <Route path="create" component={EditProfile} onEnter={noValidateUser} />
        <Route path="edit" component={EditProfile} onEnter={validateUser} />
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);
