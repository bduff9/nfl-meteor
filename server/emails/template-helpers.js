'use strict';

import { Meteor } from 'meteor/meteor';

export default {
	poolURL () {
		return Meteor.settings.baseURL;
	},

	whitespaceAfterPreview (previewText) {
		const PREVIEW_LENGTH = 200;
		const currentLength = previewText.length;
		let toAdd = PREVIEW_LENGTH - currentLength;
		let whitespaceChars = '&nbsp;';

		while (toAdd--) whitespaceChars += '&zwnj;&nbsp;';

		return whitespaceChars;
	},
};
