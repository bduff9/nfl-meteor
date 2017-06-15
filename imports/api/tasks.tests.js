/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { assert } from 'meteor/practicalmeteor:chai';

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
        throw new Error('No name found');
      });

      it('Image exists on server', () => {

      });
    });
  });
}
