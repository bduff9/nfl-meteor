'use strict';

import { Meteor } from 'meteor/meteor';
import Twilio from 'twilio';

/**
 * Sends text messages using Twilio
 * @param {string} to (The phone number to send to (prefixed with international code +1 for US))
 * @param {string} body (The text contents to be sent)
 * @param {function} cb (If desired, the function to be called upon completion (takes in error and result parms))
 */
export const sendSMS = (to, body, cb) => {
	const { accountSid, authToken, phoneNumber } = Meteor.settings.private.twilio;
	const twilioClient = new Twilio(accountSid, authToken);

	console.log(`Sending SMS to ${to}...`);

	twilioClient.messages.create({
		body,
		to,
		from: phoneNumber
	}, (err, result) => {
		if (cb) {
			cb(err, result);
		} else if (err) {
			console.error(`Error when sending SMS to ${to}`, err);
		} else {
			console.log(`SMS sent to ${to}!`);
		}
	});
};
