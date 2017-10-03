'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import { handleError } from '../../api/global';
import { getLogByID } from '../../api/collections/nfllogs';

export const Message = ({ from, msgId, message, sent, unread }) => {
	const fromStr = from && `${from.first_name} ${from.last_name}`;
	let messageObj;

	if (msgId) messageObj = getLogByID.call({ logId: msgId }, handleError);

	const _toggleMsgRead = ev => messageObj.toggleRead(unread, handleError);
	const _deleteMsg = ev => messageObj.toggleDeleted(true, handleError);

	return (
		<div className={'row message' + (unread ? ' unread' : '')}>
			<div className="col-xs-6 text-xs-left">{fromStr ? fromStr : null}</div>
			<div className="col-xs-6 text-xs-right">{sent ? sent : null}</div>
			<div className="col-xs-12 text-xs-left">{message}</div>
			{from || sent ? (
				<div className="col-xs-12 text-xs-center">
					<button type="button" className="btn btn-danger" onClick={_deleteMsg}>
						<i className="fa fa-fw fa-trash" />
						Delete
					</button>
					<button type="button" className="btn btn-primary" onClick={_toggleMsgRead}>
						<i className={'fa fa-fw fa-' + (unread ? 'envelope-o' : 'envelope')} />
						{unread ? 'Mark Read' : 'Mark Unread'}
					</button>
				</div>
			)
				:
				null
			}
		</div>
	);
};

Message.propTypes = {
	from: PropTypes.object,
	msgId: PropTypes.string,
	message: PropTypes.string.isRequired,
	sent: PropTypes.string,
	unread: PropTypes.bool.isRequired
};
