/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { moment } from 'meteor/momentjs:moment';

import './Messages.scss';
import { Message } from './Message.jsx';
import { Game, NFLLog, User } from '../../api/schema';
import { getPaymentDue } from '../../api/collections/games';
import { displayError } from '../../api/global';

class Messages extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  _formatDate(dt) {
    return moment(dt).format('ddd, MMM Do');
  }

  render() {
    const { currentUser, currentWeek, firstGame, messages, pageReady, paymentDue } = this.props,
        paid = pageReady && currentUser.paid,
        submittedPicks = pageReady && currentUser.tiebreakers[currentWeek - 1].submitted,
        submittedSurvivor = pageReady && (!currentUser.survivor[currentWeek - 1] || currentUser.survivor[currentWeek - 1].pick_id);
    return (
      <div className="messages">
        <h3 className="text-xs-center">Private Messages</h3>
        <div className="inner-messages">
          <div className="message-list">
            {!paid ? <Message message={`Please pay before ${this._formatDate(paymentDue)}`} unread /> : null}
            {!submittedPicks ? <Message message={`Your week ${currentWeek} picks are due by ${this._formatDate(firstGame.kickoff)}`} unread /> : null}
            {!submittedSurvivor ? <Message message={`Your week ${currentWeek} survivor pick is due by ${this._formatDate(firstGame.kickoff)}`} unread /> : null}
            {pageReady ? messages.map(message => <Message from={message.getUser()} msgId={'' + message._id} message={message.message} sent={this._formatDate(message.when)} unread={!message.is_read} key={'message' + message._id} />)
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

Messages.propTypes = {
  currentUser: PropTypes.object.isRequired,
  currentWeek: PropTypes.number.isRequired,
  firstGame: PropTypes.object.isRequired,
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  pageReady: PropTypes.bool.isRequired,
  paymentDue: PropTypes.object
};

export default createContainer(() => {
  const currentUser = User.findOne(Meteor.userId()),
      messagesHandle = Meteor.subscribe('allMessages'),
      messagesReady = messagesHandle.ready(),
      usersHandle = Meteor.subscribe('usersForChat'),
      usersReady = usersHandle.ready(),
      currentWeek = Session.get('currentWeek'),
      firstGameHandle = Meteor.subscribe('firstGameOfWeek', currentWeek),
      firstGameReady = firstGameHandle.ready(),
      paymentDue = Session.get('paymentDue');
  getPaymentDue.call((err, due) => {
    if (err) {
      displayError(err);
    } else {
      Session.set('paymentDue', due);
    }
  });
  let messages = [],
      firstGame = {};
  if (messagesReady) {
    messages = NFLLog.find({ action: 'MESSAGE', is_deleted: false, to_id: Meteor.userId() }, { sort: { when: -1 }}).fetch();
  }
  if (firstGameReady) {
    firstGame = Game.findOne({ week: currentWeek, game: 1 });
  }
  return {
    currentUser,
    currentWeek,
    firstGame,
    messages,
    pageReady: messagesReady && usersReady && firstGameReady,
    paymentDue
  };
}, Messages);
