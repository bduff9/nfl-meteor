/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { User } from '../../api/schema';

class Chat extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className="chat">
        Chat
      </div>
    );
  }
}

Chat.propTypes = {};

export default createContainer(() => {
  const currentUser = User.findOne(Meteor.userId()),
      chatsReady = false;
  //TODO sub to all chats and users
  let chats;
  if (chatsReady) {
    //TODO get all chats in here
  }
  return {
    chats,
    currentUser
  };
}, Chat);
