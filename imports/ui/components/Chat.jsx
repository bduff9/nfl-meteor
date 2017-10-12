'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { moment } from 'meteor/momentjs:moment';

import { formatDate, handleError } from '../../api/global';
import { getCurrentUser } from '../../api/collections/users';
import { getAllChats, writeLog } from '../../api/collections/nfllogs';

class Chat extends Component {
	constructor (props) {
		super();
		this.state = {
			newMessage: ''
		};
		this._addChat = this._addChat.bind(this);
		this._updateMessage = this._updateMessage.bind(this);
	}

	componentWillMount () {
		const user = Meteor.user();
		writeLog.call({ action: 'CHAT_OPENED', message: `${user.first_name} ${user.last_name} opened the chat`, userId: user._id }, handleError);
	}
	componentWillUnmount () {
		const user = Meteor.user();
		writeLog.call({ action: 'CHAT_HIDDEN', message: `${user.first_name} ${user.last_name} closed the chat`, userId: user._id }, handleError);
	}

	_addChat (ev) {
		const { newMessage } = this.state;
		writeLog.call({ action: 'CHAT', message: newMessage, userId: Meteor.userId() }, handleError);
		this.setState({ newMessage: '' });
	}
	_updateMessage (ev) {
		const newMessage = ev.target.value;
		this.setState({ newMessage });
	}

	render () {
		const { newMessage } = this.state,
				{ chats, pageReady } = this.props;
		let lastDay;
		return (
			<div className="chat">
				<h3 className="text-center">Chat</h3>
				<div className="inner-chat">
					<div className="text-right add-chat">
						<textarea className="form-control new-chat" value={newMessage} onChange={this._updateMessage} />
						{newMessage.length} | <button type="button" className="btn btn-primary" disabled={newMessage.length === 0} onClick={this._addChat}>Submit</button>
					</div>
					<div className="chat-list">
						{pageReady ? chats.map(chat => {
							const daySent = moment(chat.when).format('dddd, MMMM Do, YYYY'),
									user = chat.getUser();
							let rows = [];
							if (daySent !== lastDay) {
								rows.push(<div className="text-center" key={daySent}>{daySent}</div>);
								lastDay = daySent;
							}
							rows.push(
								<div className="a-chat" key={'chat' + chat._id}>
									<strong>{`${user.first_name} ${user.last_name}: `}</strong>
									{chat.message}
									<span className="chat-sent" title={formatDate(chat.when, true)}>{moment(chat.when).fromNow()}</span>
								</div>
							);
							return rows;
						})
							:
							(
								<div className="text-center loading">Loading...
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
	const currentUser = getCurrentUser.call({}, handleError),
			chatsHandle = Meteor.subscribe('allChats'),
			chatsReady = chatsHandle.ready(),
			usersHandle = Meteor.subscribe('basicUsersInfo'),
			usersReady = usersHandle.ready(),
			pageReady = chatsReady && usersReady;
	let chats = [];
	if (pageReady) chats = getAllChats.call({}, handleError);
	return {
		chats,
		currentUser,
		pageReady: chatsReady && usersReady
	};
}, Chat);
