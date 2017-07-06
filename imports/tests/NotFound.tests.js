/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { assert } from 'meteor/practicalmeteor:chai';

import { _get404Image, imgs } from '../ui/pages/NotFound.jsx';

if (Meteor.isServer) {
	describe('Tasks', () => {
		describe('methods', () => {
			it('can delete owned task', () => {
				assert.equal(1, 1);
			});
		});
	});
}

if (Meteor.isClient) {
	describe('404 Page', () => {
		describe('NFL Image', () => {
			it('Image names are valid', () => {
				console.log(imgs);
				console.log(_get404Image);
			});

			it('Image exists on server', () => {

			});
		});
	});
}
