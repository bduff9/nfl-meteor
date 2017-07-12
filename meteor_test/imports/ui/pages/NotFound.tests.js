/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { assert } from 'meteor/practicalmeteor:chai';

import { _get404Image, imgs } from '../../../../imports/ui/pages/NotFound.jsx';

if (Meteor.isClient) {
	describe('404 Page', function () {
		describe('NFL Image', function () {
			it('Random image is valid', function () {
				var imgName = _get404Image();
				var imgIndex = imgs.indexOf(imgName);		
				assert.notStrictEqual(imgIndex, -1);
			});

			it('Image exists on server', function () {

			});
		});
	});
}
