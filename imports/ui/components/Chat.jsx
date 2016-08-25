/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { moment } from 'meteor/momentjs:moment';

import { NFLLog, User } from '../../api/schema';
import { updateChatHidden } from '../../api/collections/users';
import { writeLog } from '../../api/collections/nfllogs';
import { displayError } from '../../api/global';

class Chat extends Component {
  constructor(props) {
    super();
    this.state = {
      newMessage: ''
    };
    this._addChat = this._addChat.bind(this);
    this._updateMessage = this._updateMessage.bind(this);
  }

  componentWillMount() {
    const user = Meteor.user();
    writeLog.call({ action: 'CHAT_OPENED', message: `${user.first_name} ${user.last_name} opened the chat`, userId: user._id }, displayError);
  }
  componentWillUnmount() {
    const user = Meteor.user();
    writeLog.call({ action: 'CHAT_HIDDEN', message: `${user.first_name} ${user.last_name} closed the chat`, userId: user._id }, displayError);
  }

  _addChat(ev) {
    const { newMessage } = this.state;
    writeLog.call({ action: 'CHAT', message: newMessage, userId: Meteor.userId() }, displayError);
    this.setState({ newMessage: '' });
  }
  _updateMessage(ev) {
    const newMessage = ev.target.value;
    this.setState({ newMessage });
  }

  render() {
    const { newMessage } = this.state,
        { chats, pageReady } = this.props;
    let lastDay;
    return (
      <div className="chat chat-wrapper">
        <h3 className="text-xs-center">Chat</h3>
        <div className="inner-chat">
          <div className="text-xs-right add-chat">
            <textarea className="form-control new-chat" value={newMessage} onChange={this._updateMessage} />
            {newMessage.length} | <button type="button" className="btn btn-primary" disabled={newMessage.length === 0} onClick={this._addChat}>Submit</button>
          </div>
          <div className="chat-list">
            {pageReady ? chats.map(chat => {
              const daySent = moment(chat.when).format('dddd, MMMM Do, YYYY'),
                  user = chat.getUser();
              let rows = [];
              if (daySent !== lastDay) {
                rows.push(<div className="text-xs-center" key={daySent}>{daySent}</div>);
                lastDay = daySent;
              }
              rows.push(
                <div className="a-chat" key={'chat' + chat._id}>
                  <strong>{`${user.first_name} ${user.last_name}: `}</strong>
                  {chat.message}
                  <span className="chat-sent" title={moment(chat.when).format('dddd, MMMM Do, YYYY [at] h:mma')}>{moment(chat.when).fromNow()}</span>
                </div>
              );
              return rows;
            })
            :
            (
              <div className="text-xs-center loading">Loading...
                <br />
                <i className="fa fa-spinner fa-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

Chat.propTypes = {
  chats: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentUser: PropTypes.object.isRequired,
  pageReady: PropTypes.bool.isRequired
};

export default createContainer(() => {
  const currentUser = User.findOne(Meteor.userId()),
      chatsHandle = Meteor.subscribe('allChats'),
      chatsReady = chatsHandle.ready(),
      usersHandle = Meteor.subscribe('usersForChat'),
      usersReady = usersHandle.ready();
  let chats = [];
  if (chatsReady && usersReady) {
    chats = NFLLog.find({ action: 'CHAT' }, { sort: { when: -1 }}).fetch();
  }
  return {
    chats,
    currentUser,
    pageReady: chatsReady && usersReady
  };
}, Chat);
