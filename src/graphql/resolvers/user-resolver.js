import User from '../../models/User';
import { requireAuth } from '../../services/auth';
import { storeUpload, deleteFile } from '../../services/upload';
import Tag from '../../models/Tag';

// The Comments may be a little confusing so I will try my best to clarify things
// the Requesting User is The Client 
// The Requested User or the Target User is the User that the client is Requesting its data
// Requested Article is self explanatory
// When I use Current User/Article/item/etc. Usually it's in an iteretion and I'm refering to the iterated User/Article/etc.


export default {
  // it signs up a user and gives u a token
  // in front , it will also transfer u to the app ( no login required )
  signup: async (_, { ...args }) => {
    try {
      // creates the User
      // Note: Currently there is no Email Verification but it's going to be implemented 
      const user = await User.create({ ...args });
      // returns a token
      return {
        token: user._createToken(),
      }
    } catch (error) {
      throw error
    }
  },
  // self explanatory, it lets u login
  login: async (_, {email, password}) => {
    try {
      // it gets the user with the email given
      const user = await User.findOne({email});
      // if it doesn't find a user it throws An Error
      if (!user) {
        throw new Error('User not Exist!')
      }
      // if the password doesn't match the database it throws an Error
      if (!user._authenticateUser(password)) {
        throw new Error('Wrong Password');
      }
      // if it's successful it returns a token
      return {
        token: user._createToken()
      }
    } catch (error) {
      throw error
    }
  },
  // gives the Requesting User 
  me: async (_,args, {user}) => {
    try {
      // check if the user is Authenticated
      const me = await requireAuth(user)
      // calculate the fullname for Front Purposes
      const fullName = `${me.firstName} ${me.lastName}`
      // let us know that this User is indeed the Requesting User
      const ME = Object.assign(me, {isSelf: true, fullName})
      return ME
    } catch (error) {
      throw error;
    }
  },
  // self explanatory : it Updates the Profile 
  editProfile: async (_, {firstName, lastName, bio, Position}, {user}) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user);
      // this finds the Requesting User and Updates the new Parameters
      // Note: I think the {new: true} option is Unnessary
      // since we're not returning the user and it is handled in the front with a simple refetch
      await User.findOneAndUpdate({ _id: user._id }, { firstName, lastName, bio, Position }, { new: true })
      // return a simple message
      return {
        message: 'Update Successful'
      }
    } catch (error) {
      throw error
    }
  },
  // the name is a bit off, It handles the Profile Picture Upload of a User
  singleUpload: async (_, {file}, {user}) => {
    try {
      // check if the user is Authenticated
      const ME = await requireAuth(user)
      // checks if the user has an old Profile Picture
      if (ME.avatar) {
        // get the address of the last Profile Picture 
        const hhh = ME.avatar.split('/')
        const lastLocation = `src/public/${hhh[3]}/${hhh[4]}`
        // delete the last Picture Since We're not intrested in Multiple Images
        deleteFile(lastLocation)
      }
      // generate a new FileName for the new Picture
      const a = Math.floor(Date.now() / 1000)
      const myFileName = `${user._id}${a}`
      // await for the file from Front
      const { stream, filename } = await file
      // upload it to the server
      await storeUpload({ stream, filename, myFileName })
      // update the user's Profile Picture URL
      // Please Note That the ip presented in the url is in that special port since
      // I was working with Emulator and Local Host. in the Project is going to be deployed on the internet
      // this is going to change
      await User.findOneAndUpdate({ _id: user._id }, { avatar: `http://10.0.2.2:2999/UserAvatars/${myFileName}.jpg` }, { new: true })
      // return a Boolean (wiered Structure since this part of the code is Copy Paste, gonna work on that later)
      return true
    } catch (error) {
      throw error
    }
  },
  // get a Target User
  getUser: async (_, { _id }, { user }) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user)
      // find the Target User
      const thisUser = await User.findById(_id)
      // if there is no Such User, Just throw a Simple Error
      if(!thisUser) {
        throw new Error('No such User Found')
      }
      // check if the Target User is same as the Requesting User
      const isSelf = (_id === user._id)
      // append the fullname to display
      const fullName = `${thisUser.firstName} ${thisUser.lastName}`
      // check if the Requesting User is following the Target User
      // wierd Algorithm : since u can't follow urself, if isSelf is indeed true, we dont care about haveIfollowed
      // but it is a little wiered , I should work on this
      const haveIfollowed = thisUser.follower.some(User => User.user === user._id)
      // assign these calculated values to a new Object and send it to front
      return Object.assign(thisUser, {haveIfollowed, isSelf, fullName})
    } catch (error) {
      throw error
    }
  },
  // handles the Follow Button 
  followHandler: async (_, { _id }, { user }) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user)
      // find the Target User
      const thisUser = await User.findById(_id)
      // check if the Requesting User has followed the Target User
      const haveIfollowed =  thisUser.follower.some(User => User.user === user._id)
      // if it has followed it , simply remove the folliowng from Requestin User
      // and Remove the Follower from the Target User
      // or Vice Versa
      if (haveIfollowed) {
        await User.findOneAndUpdate({_id}, {$pull: {"follower": {user: user._id}}})
        await User.findOneAndUpdate({_id: user._id}, {$pull: {"following": {user: _id}}})
      } else {
        await User.findOneAndUpdate({_id}, {$push: {"follower": {user: user._id}}})
        await User.findOneAndUpdate({_id: user._id}, {$push: {"following": {user: _id}}})
      }
      // return a simple message
      return {
        message: 'Successfully Handled this follow/unfollow Request'
      }
    } catch (error) {
      throw error
    }
  },
  // set Favorite Fields : Edit Profile Purposes
  SetFavoriteFields: async (_, { tags }, { user }) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user)
      // Find The Requesting User And Update its Favorite Fields
      await User.findOneAndUpdate({ _id: user._id }, { $set: { FavoriteFields: tags } })
      // return a Simple Message
      return {
        message: 'Successfully Updated Ur Tags'
      }
    } catch (error) {
      throw error
    }
  },
  // get All The Users that are following the Target User
  getUserFollowers: async (_, { _id }, { user }) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user)
      // get the Target User
      const thisUser = await User.findById(_id)
      // return the Followers of that user
      return thisUser.follower
    } catch (error) {
      throw error
    }
  },
  // get All the Users that are followed by the Target User
  getUserFollowings: async (_, { _id }, { user }) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user)
      // get the Target User
      const thisUser = await User.findById(_id)
      // return the Users that The Target User is Following
      return thisUser.following
    } catch (error) {
      throw error
    }
  }
}