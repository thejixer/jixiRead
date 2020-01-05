import jwt from 'jsonwebtoken';

import constants from '../config/constants';
import User from '../models/User';

//  VALIDATE THE USER REQUESTING THE MUTATION 
export async function requireAuth(user) {

  if (!user || !user._id) {
    throw new Error('Unathorized')
  }

  const me = await User.findById(user._id)

  if (!me) {
    throw new Error('Unauthorized')
  }

  return me
}


// CHECKS IF TOKEN COMING FROM THE REQUEST HEADER IS VALID 
export function decodeToken(token) {
  const arr = token.split(' ');

  if ( arr[0] === 'Bearer') {
    return jwt.verify(arr[1], constants.JWT_SECRET);
  } 

  throw new Error('Token not valid!')
}