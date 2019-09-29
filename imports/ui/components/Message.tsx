import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FC, memo } from 'react';

import { getLogByID, TNFLLog } from '../../api/collections/nfllogs';
import { TUser } from '../../api/collections/users';
import { handleError } from '../../api/global';

export type TMessageProps = {
	from?: TUser | null;
	msgId?: string;
	message: string;
	sent?: string;
	unread: boolean;
};

const Message: FC<TMessageProps> = ({
	from,
	msgId,
	message,
	sent,
	unread,
}): JSX.Element => {
	const fromStr = from && `${from.first_name} ${from.last_name}`;
	let messageObj: TNFLLog | null = null;

	if (msgId) messageObj = getLogByID.call({ logId: msgId }, handleError);

	const _toggleMsgRead = (): void => {
		if (messageObj) messageObj.toggleRead(unread, handleError);
	};

	const _deleteMsg = (): void => {
		if (messageObj) messageObj.toggleDeleted(true, handleError);
	};

	return (
		<div className={`row message${unread ? ' unread' : ''}`}>
			<div className="col-6 text-left">{fromStr && fromStr}</div>
			<div className="col-6 text-right">{sent && sent}</div>
			<div className="col-12 text-left">{message}</div>
			{(from || sent) && (
				<div className="col-12 text-center">
					<button type="button" className="btn btn-danger" onClick={_deleteMsg}>
						<FontAwesomeIcon icon={['fad', 'trash']} fixedWidth />
						Delete
					</button>
					<button
						type="button"
						className="btn btn-primary"
						onClick={_toggleMsgRead}
					>
						<FontAwesomeIcon
							icon={['fad', unread ? 'envelope-open' : 'envelope']}
							fixedWidth
						/>
						{unread ? 'Mark Read' : 'Mark Unread'}
					</button>
				</div>
			)}
		</div>
	);
};

Message.whyDidYouRender = true;

export default memo(Message);
