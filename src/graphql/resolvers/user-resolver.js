import User from '../../models/User';
import { requireAuth } from '../../services/auth';
import { storeUpload, deleteFile } from '../../services/upload';
import Tag from '../../models/Tag';

export default {
  signup: async (_, { firstName, lastName , ... rest }) => {
    try {
      const user = await User.create({ firstName, lastName, ... rest});
      
      return {
        token: user._createToken(),
      }
    } catch (error) {
      throw error
    }
  },
  login: async (_, {email, password}) => {
    try {
      const user = await User.findOne({email});

      if (!user) {
        throw new Error('User not Exist!')
      }
  
      if (!user._authenticateUser(password)) {
        throw new Error('Wrong Password');
      }
  
      return {
        token: user._createToken()
      }
    } catch (error) {
      throw error
    }
  },
  me: async (_,args, {user}) => {
    try {
      const me = await requireAuth(user)
      const fullName = `${me.firstName} ${me.lastName}`
      const ME = Object.assign(me, {isSelf: true, fullName})
      return ME
    } catch (error) {
      throw error;
    }
  },
  editProfile: async (_, {firstName, lastName, bio, Position}, {user}) => {
    try {
      await requireAuth(user);
      await User.findOneAndUpdate({_id: user._id }, {firstName, lastName, bio, Position}, {new: true})
      return {
        message: 'Update Successful'
      }
    } catch (error) {
      throw error
    }
  },
  singleUpload: async (_, {file}, {user}) => {
    try {
      const ME = await requireAuth(user)

      if(ME.avatar) {
        const hhh = ME.avatar.split('/')
        const lastLocation = `src/public/${hhh[3]}/${hhh[4]}`
        deleteFile(lastLocation)
      }

      const a = Math.floor(Date.now() / 1000)
      const myFileName = `${user._id}${a}`
      const { stream, filename } = await file
      await storeUpload({stream, filename, myFileName})
      await User.findOneAndUpdate({_id: user._id }, {avatar: `http://10.0.2.2:2999/UserAvatars/${myFileName}.jpg`}, {new: true})
      return true
    } catch (error) {
      throw error
    }
  },
  getUser: async (_, {_id} , {user}) => {
    try {
      await requireAuth(user)
      const thisUser = await User.findById(_id)
      

      if(!thisUser) {
        throw new Error('No such User Found')
      }

      const isSelf = (_id === user._id)
      const fullName = `${thisUser.firstName} ${thisUser.lastName}`

      const haveIfollowed =  thisUser.follower.some(User => User.user === user._id)
      const thatUser = Object.assign(thisUser, {haveIfollowed, isSelf, fullName})
      return thatUser
    } catch (error) {
      throw error
    }
  },
  followHandler: async (_,{_id},{user}) => {
    try {
      await requireAuth(user)
      const thisUser = await User.findById(_id)

      const haveIfollowed =  thisUser.follower.some(User => User.user === user._id)

      if (haveIfollowed) {
        await User.findOneAndUpdate({_id}, {$pull: {"follower": {user: user._id}}})
        await User.findOneAndUpdate({_id: user._id}, {$pull: {"following": {user: _id}}})
      } else {
        await User.findOneAndUpdate({_id}, {$push: {"follower": {user: user._id}}})
        await User.findOneAndUpdate({_id: user._id}, {$push: {"following": {user: _id}}})
      }


      return {
        message: 'Successfully Followed this user'
      }
    } catch (error) {
      throw error
    }
  },
  SetFavoriteFields: async (_,{tags}, {user}) => {
    try {
      const ME = await requireAuth(user)
      await User.findOneAndUpdate({_id: user._id}, {$set: {FavoriteFields: tags}})
      return {
        message: 'Successfully Updated Ur Tags'
      }


    } catch (error) {
      throw error
    }
  },
  getUserFollowers: async (_, {_id}, {user}) => {
    try {
      await requireAuth(user)
      const thisUser = await User.findById(_id)
      return thisUser.follower
    } catch (error) {
      throw error
    }
  },
  getUserFollowings: async (_, {_id}, {user}) => {
    try {
      await requireAuth(user)
      const thisUser = await User.findById(_id)
      return thisUser.following
    } catch (error) {
      throw error
    }
  }
}