import Article from '../../models/Article'
import Tag from '../../models/Tag'
import User from '../../models/User'
import { requireAuth } from '../../services/auth'
import { asyncForEach } from '../../services/asyncForEach'
import { ArticlePictureUpload } from '../../services/upload'

// The Comments may be a little confusing so I will try my best to clarify things
// the Requesting User is The Client 
// The Requested User or the Target User is the User that the client is Requesting its data
// Requested Article is self explanatory
// When I use Current User/Article/item/etc. Usually it's in an iteretion and I'm refering to the iterated User/Article/etc.


export default {
  // get A specefic Article using the given Id from Query Arguments
  getArticle: async (_, { _id }, { user }) => {
    try {
      // check if the user is Authenticated
      const ME = await requireAuth(user)
      // get the Target Article 
      const thisArticle = await Article.findById(_id)

      // throw Error If there is no Article Found by the given ID
      if (!thisArticle) {
        throw new Error('Not Found')
      }

      // calculate the needed Booleans for Front End Configurations
      // checks if the Requesting User has already Commented on the Target Article
      const haveIcommented = thisArticle.Reviews.some(art => art.user === user._id)
      // checks if the User has Bookmarked this Article or not
      const haveIsaved = ME.SavedArticles.some(savedArt => savedArt.article.toString() === thisArticle._id.toString())
      // checks if the Requesting User is the Author of the Article or not
      const isAuthor = (thisArticle.user.toString() === user._id.toString())
      // assign these variables to the article and sent it to the Front End
      return Object.assign(thisArticle, {haveIcommented, haveIsaved, isAuthor})
    } catch (error) {
      throw error
    }
  },
  // the following function is for Dev Purposes and will be removed eventaully
  getArticles: async (_,args, {user}) => {
    try {
      return Article.find({}).sort({ createdAt: -1})
    } catch (error) {
      throw error
    }
  },
  // get All Articles Submited by the Target User ( the given _id argument is the id of a user)
  getUserArticles: async (_,{_id}, {user}) => {
    try {
      // check if the user is Authenticated
      const ME = await requireAuth(user)
      // initiate an empty array 
      const results = []
      // find articles of the Requested User
      const TheseArticles = await Article.find({ user: _id })
      // iterate to the articles of the Requested User
      TheseArticles.forEach(art => {
        // checks if the Requesting user has saved each Article  
        const haveIsaved = ME.SavedArticles.some(savedArt => savedArt.article.toString() === art._id.toString())
        // adding the calculated haveIsaved Boolean to the Object
        const ThatArticle = Object.assign(art, { haveIsaved })
        // and finally pushing it to the empty array
        results.push(ThatArticle)
      })
      // sending the Results as an Array of Articles 
      return results
    } catch (error) {
      throw error
    }
  },
  // this creates a new Article 
  createArticle: async (_, {tags,Picture, ...rest}, {user}) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user);
      // a simple loop to create the not existing tags into the Tag Collection ( for searching purpuses)
      tags.forEach(async item => {
        const wtf = await Tag.findOne({title: item})
        if(!wtf) {
          await Tag.create({title: item})
        }
      })
      // generate a new file name with timestamps for the picture of the article 
      const pictureName = Math.floor(Date.now() / 1000)
      const myFileName = `${user._id}${pictureName}`
      // wait to get the file from front end
      const { stream, filename } = await Picture
      // upload the picture into the server
      await ArticlePictureUpload({ stream, filename, myFileName })
      // post the picture into Article Collection + adding the picture url as Picture
      // Please Note That the ip presented in the url is in that special port since
      // I was working with Emulator and Local Host. in the Project is going to be deployed on the internet
      // this is going to change
      const thisArticle = await Article.create({ tags, Picture: `http://10.0.2.2:2999/ArticleRelated/${myFileName}.jpg`, ...rest, user: user._id })
      // add this Article to the User Article in User Collection so we keep the track of Articles posted by each User
      await User.findOneAndUpdate({ _id: user._id }, { $push: { UserArticles: { article: thisArticle._id.toString() } } })
      // return this article
      return thisArticle
    } catch (error) {
      throw error
    }
  },
  // this Updates the Target Article
  updateArticle: async (_,{_id, ...rest}, {user}) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user);
      // find the Target Article
      const article = await Article.findOne({ _id, user: user._id});
      // if it doesn't exist , throw an Error
      if (!article) {
        throw new Error('Not Found')
      }
      // update the article for each of the key value pairs that are presented 
      Object.entries(rest).forEach(([key,value]) => {
        article[key] = value
      })
      // return the new article 
      return article.save();
    } catch (error) {
      throw error
    }
  },
  // this deletes the Target Article 
  deleteArticle: async (_, {_id}, {user}) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user);
      // find the Target Article
      const article = await Article.findOne({ _id})
      // if there is no article throw a Not Found Error
      if (!article) {
        throw new Error('Not Found!')
      }
      // usually this is not nessassary since people can't access this option if they are not the author of the article
      // but a little caution doesn't hurt
      // checks if the User Requesting to Delete the Article is indeed the Author of the Article 
      // and throw an Unathorized error if it is needed
      if (article.user.toString() !== user._id.toString()) {
        throw new Error('UnAthorized')
      }
      // first remove the id of the Article from the UserArticle Section in User Collection
      await User.findOneAndUpdate({_id: user._id}, {$pull: {"UserArticles": {article: _id}}})
      // Please Remember this is My First Project, I am a Juniour Back End Developer, And I didn't know any better Solution
      // I don't think this is the best way to do it but I'm not sure weather this is not a good solution or not
      // the following Steps get all Users and checks if those users have saved this article and removes the id of deleted Article 
      // from their SavedArticle Section in User Collection

      // get all users
      const AllUsers = await User.find({})

      // iterate through all users
      // note : this is a Method That I created since JavaScript ForEach doesn't support async callbacks
      await asyncForEach(AllUsers, async thisUser => {
        // checks if the current user has saved this article 
        const isItThere = thisUser.SavedArticles.some(savedArt => savedArt.article.toString() === _id.toString()) 
        // if he has not saved the article simply go to the next user
        if(!isItThere) return 
        // if he has indeed saved the article , remove it from their SavedArticle Section
        await User.findOneAndUpdate({_id: thisUser._id}, {$pull: {"SavedArticles": {article: _id}}})
      })
      // and finally delete the article from the DataBase
      await article.remove();
      // and finally return a simple message
      return {
        message: 'Delete Successful'
      }
    } catch (error) {
      throw error;
    }
  },
  // this lets users add reviews on the Articles 
  // it gets _id of the article and review Text + point int ( 1-5 ) 
  addReview: async (_, { _id, review, point }, { user }) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user);
      // find the Target Article 
      const article = await Article.findById(_id);
      // throw Not Found Error there is no such article with given id
      if (!article) {
        throw new Error ('Not Found!')
      }
      // usually this next step isn't nessassary since users can't access add Review Button in Front End if they have already commented
      // but again , a little caution doesn't hurt
      // checks if the Requesting User has Already Commented on the Target Article
      const alreadyCommented = article.Reviews.some(review => review.user === user._id)
      // if they have already commented, throw a Simple Error
      if (alreadyCommented) {
        throw new Error ('Already Commented')
      }
      // add the review with its text and point to the Reviews Section of the Target Article
      await Article.findOneAndUpdate({_id}, {$push: { "Reviews": {user: user._id, review, point}}})
      // get the Target Article Again to Update its Point Average
      const thisArticle = await Article.findById(_id)
      // calculate the Point Average and update this article yet again
      const Point = thisArticle.Reviews.reduce((total, current) => {
        return total + current.point
      }, 0)
      const PointAverage = Point / thisArticle.Reviews.length

      await Article.findOneAndUpdate({_id},{$set: {"PointAverage": PointAverage}})
      // Return a Simple Success Message
      return {
        message: 'Comment Successfully Added'
      }
    } catch (error) {
      throw error
    }
  },
  // gets All Articles that the Requesting User is intrested (has followed the tag )
  getSelectedArticlesbyTags: async (_, args, { user }) => {
    try {
      // check if the user is Authenticated
      const ME = await requireAuth(user);
      // initiate a new Array
      const results = []
      // iterate through the Requesting User's Favorite Fields
      // note : this is a Method That I created since JavaScript ForEach doesn't support async callbacks
      await asyncForEach(ME.FavoriteFields, async item => {
        // get all articles with the current tag
        const theseArticles = await Article.find({tags: item}).sort({createdAt: -1})
        // iterate through the found articles
        theseArticles.forEach(article => {
          // I don't remember why I put this But I think this is needed :D:D:D since the app works perfectly 
          // note : I will Update the upper line later
          if(!article) return
          // this checks if the current article is in the results array or not
          const AmIthere = results.some(jix => jix._id.toString() === article._id.toString())
          // if it is already in the results array , it just updates the because Array ( it is a field of the articles in the results array)
          // it just shows why a specefic article is sent to the user's feed ( what tag it has in common with the user's favorite tags)
          if(AmIthere) {
            results.forEach((art, i) => {
              if (art._id.toString() === article._id.toString()) {
                art.because.push(item)
              }
            })
            return
          }
          // moreover it checks if the User has Saved this article or not 
          const haveIsaved = ME.SavedArticles.some(savedArt => {
            return savedArt.article.toString() === article._id.toString()
          })
          // append the because field with the current item and haveIsaved field 
          const thatArticle = Object.assign(article, { because: [item], haveIsaved })
          // and push this article into the results array
          results.push(thatArticle)

        })
      })
      // and finally return the results array
      return results
    } catch (error) {
      throw error
    }
  },
  // Gets All articles of the Users that The Requesting User has followed 
  getSelectedArticlesByUsers: async (_, args, { user }) => {
    try {
      // check if the user is Authenticated
      const ME = await requireAuth(user)
      // initiate an empty array
      const results = []
      // iterate through the following User's of the Requesting User
      await asyncForEach(ME.following, async User => {
        // find all articles of the Current User
        const theseArticles = await Article.find({user: User.user})
        // iterate through their Articles
        theseArticles.forEach(art => {
          // check if the Requesting User has saved the current article
          const haveIsaved = ME.SavedArticles.some(savedArt => savedArt.article.toString() === art._id.toString())
          // assign the haveISaved field to the Article 
          const ThatArticle = Object.assign(art, { haveIsaved })
          // and push it to the results
          results.push(ThatArticle)
          // note : there is no need to double check if it's already in the array since its not possible due to the facct that 
          // each article has only one author
        })
      })
      // return the results
      return results
    } catch (error) {
      throw error
    }
  },
  // gets Articles By a Specefic Tag
  getArticlesBySpeceficTag: async (_, {tag}, {user}) => {
    try {
      // check if the user is Authenticated
      const ME = await requireAuth(user)
      // initiate an empty Array
      const results = []
      // get all Articles with a Specefic Tag
      const TheseArticles = await Article.find({tags: tag}).sort({createdAt: -1})
      // iterate through them
      TheseArticles.forEach(art => {
        // check if the Requesting User has saved the current article
        const haveIsaved = ME.SavedArticles.some(savedArt => savedArt.article.toString() === art._id.toString())
        // assign the haveIsaved to the Article 
        const ThatArticle = Object.assign(art, { haveIsaved })
        // push it to results
        results.push(ThatArticle)
      })
      // return the results
      return results
    } catch(error) {
      throw error
    }
  },
  // Handles bookmark Click
  HandleSaveArticle: async (_, { _id }, { user }) => {
    try {
      // check if the user is Authenticated
      await requireAuth(user)
      // find the Requesting User
      const thisUser = await User.findOne({_id: user._id}) 
      // if checks if the Requesting User has already saved the article or not
      const haveIsaved = thisUser.SavedArticles.some(art => art.article === _id)
      // if they have saved it , it will simply unsave it or else 
      if(haveIsaved) {
        await User.findOneAndUpdate({_id: user._id} , {$pull: {"SavedArticles" : {article: _id}}})
      } else {
        await User.findOneAndUpdate({_id: user._id} , {$push: {"SavedArticles" : {article: _id}}})
      }

      // return a simple success msg
      return {
        message: 'Success!'
      }
    } catch (error) {
      throw error
    }
  },
  // get the Articles that the Requesting User has Bookmarked 
  getSavedArticles: async (_, args, {user}) => {
    try {
      // check if the user is Authenticated
      const ME = await requireAuth(user)
      // return Saved Articles of the Requesting User
      // note : (there is an extra page in the Front End where users can access the Articles that they have already bookmarked)
      return ME.SavedArticles
    } catch (error) {
      throw error
    }
  }
}