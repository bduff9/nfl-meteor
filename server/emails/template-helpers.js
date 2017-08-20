'use strict';

export default {
	whitespaceAfterPreview (previewText) {
		const PREVIEW_LENGTH = 200,
				currentLength = previewText.length;
		let toAdd = PREVIEW_LENGTH - currentLength,
				whitespaceChars = '&nbsp;';
		while (toAdd--) whitespaceChars += '&zwnj;&nbsp;';
		return whitespaceChars;
	}
};
