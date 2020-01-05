import GraphQLDate from 'graphql-date'
import { PubSub } from 'graphql-subscriptions'

import UtilityResolver from './utility-resolver'
import ArticleResolver from './article-resolvers'
import UserResolver from './user-resolver'
import User from '../../models/User'
import Article from '../../models/Article'
import utilityResolver from './utility-resolver'
import { requireAuth } from '../../services/auth'


// const pubsub = new PubSub();

// const payload = {
//   commentAdded: {
//       id: '1',
//       content: 'Hello!',
//   }
// };

export default {
  Date: GraphQLDate,
  Review: {
    user: ({user}) => User.findById(user),
  },
  UserArticle: {
    article: ({article}) => Article.findById(article)
  },
  SavedArticle: {
    article: async ({article}) => {
      const thisArticle = await Article.findById(article)
      const thatArticle = Object.assign(thisArticle, {haveIsaved: true})
      return thatArticle
    }
  },
  Article: {
    user: ({user}) => User.findById(user),
  },
  Follower: {
    user: async ({user},_,ctx) => {
      const ME = await requireAuth(ctx.user)
      const thisUser = await User.findById(user)
      const haveIfollowed = ME.following.some(jax => {
        return jax.user.toString() === user.toString()
      })
      const isSelf = (thisUser._id.toString() === ctx.user._id.toString())
      const ThatUser = Object.assign(thisUser, {haveIfollowed, isSelf})
      return ThatUser
    },
  },
  Query: {
    getArticle: ArticleResolver.getArticle,
    getArticles: ArticleResolver.getArticles,
    getUserArticles: ArticleResolver.getUserArticles,
    me: UserResolver.me,
    getUser: UserResolver.getUser,
    getSelectedArticlesbyTags: ArticleResolver.getSelectedArticlesbyTags,
    getSelectedArticlesByUsers: ArticleResolver.getSelectedArticlesByUsers,
    getArticlesBySpeceficTag: ArticleResolver.getArticlesBySpeceficTag,
    getUserFollowers: UserResolver.getUserFollowers,
    getUserFollowings: UserResolver.getUserFollowings,
    getSavedArticles: ArticleResolver.getSavedArticles,
    test: utilityResolver.test
  },
  Mutation: {
    createArticle: ArticleResolver.createArticle,
    updateArticle: ArticleResolver.updateArticle,
    deleteArticle: ArticleResolver.deleteArticle,
    addReview: ArticleResolver.addReview,
    signup: UserResolver.signup,
    login: UserResolver.login,
    editProfile: UserResolver.editProfile,
    singleUpload: UserResolver.singleUpload,
    followHandler: UserResolver.followHandler,
    SetFavoriteFields: UserResolver.SetFavoriteFields,
    tagAutoComplete: UtilityResolver.tagAutoComplete,
    HandleSaveArticle: ArticleResolver.HandleSaveArticle
  }
}