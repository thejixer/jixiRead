import mongoose, {Schema} from 'mongoose';
import { hashSync, compareSync } from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';

import constants from '../config/constants';

// MONGO DB SCHEMA
const UserSchema = new Schema({
  firstName: String,
  lastName: String,
  avatar: String,
  password: String,
  email: String,
  UserArticles: Array,
  FavoriteFields: Array,
  bio: {
    type: String,
    minlength: [5, 'Text needs to be longer'],
    maxlength: [300, 'Text too long'],   
  },
  professions: Array,
  following: Array,
  follower: Array,
  SavedArticles: Array,
  Position: String
}, { timestamps: true });


UserSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    this.password = this._hashPassword(this.password);
    return next();
  }
  return next();
})


UserSchema.methods = {
  _hashPassword(password) {
    return hashSync(password);
  },
  _authenticateUser(password) {
    return compareSync(password, this.password)
  },
  _createToken(){
    return jwt.sign(
      {
        _id: this._id
      },
      constants.JWT_SECRET
    )
  }
}

export default mongoose.model('User', UserSchema);