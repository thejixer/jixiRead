/* eslint-disable no-console */

import mongoose from 'mongoose';

import constants from './constants';
// TO BE HONEST I DON'T KNOW WHAT THIS DOES
mongoose.Promise = global.Promise;

mongoose.set('debug', true); // debug mode on

try {
  mongoose.connect(constants.DB_URL, constants.DB_SETTINGS);
} catch (err) {
  mongoose.createConnection(constants.DB_URL, constants.DB_SETTINGS);
}

mongoose.connection
  .once('open', () => console.log('MongoDB Running'))
  .on('error', e => {
    throw e;
  });