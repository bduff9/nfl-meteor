/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { assert } from 'meteor/practicalmeteor:chai';

import { _get404Image, imgs } from '../../../../imports/ui/pages/NotFound.jsx';

if (Meteor.isServer) {
	describe('Base Test', function() {
		describe('Sub Test', function() {
			it('Should pass', function() {
				assert.equal(1, 1);
			});
			it('Should fail', function() {
				assert.equal(1, 2);
			});
		});
	});
}

if (Meteor.isClient) {
	describe('404 Page', function() {
		describe('NFL Image', function() {
			it('Image names are valid', function(){
				console.log(imgs);
				console.log(_get404Image);
			});

			it('Image exists on server', function() {

			});
		});
	});
}
