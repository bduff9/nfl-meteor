import React from 'react';
import { IndexLink, Link } from 'react-router';

import './navigation.scss';

export const Navigation = () => (
  <ul>
    <li><IndexLink to="/" activeClassName="active">Home</IndexLink></li>
    <li><Link to="/picks/set" activeClassName="active">Make Picks</Link></li>
    <li><Link to="/picks/view" activeClassName="active">View My Picks</Link></li>
    <li><Link to="/picks/viewall" activeClassName="active">View All Picks</Link></li>
    <li><Link to="/survivor/set" activeClassName="active">Make Survivor Picks</Link></li>
    <li><Link to="/survivor/view" activeClassName="active">View Survivor Picks</Link></li>
    <li><Link to="/users/edit" activeClassName="active">Edit My Profile</Link></li>
    <li><Link to={{ pathname: '/logout', state: { isLogout: true } }} activeClassName="active">Signout</Link></li>
  </ul>
)