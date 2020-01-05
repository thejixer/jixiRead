import Article from '../../models/Article'
import Tag from '../../models/Tag'
import User from '../../models/User'
import { requireAuth } from '../../services/auth'
import { asyncForEach } from '../../services/asyncForEach'
import { ArticlePictureUpload } from '../../services/upload'

export default {
  getArticle: async (_,{_id}, {user}) => {
    try {
      const ME = await requireAuth(user)

      const thisArticle = await Article.findById(_id)

      if (!thisArticle) {
        throw new Error('Not Found')
      }

      const haveIcommented = thisArticle.Reviews.some(art => art.user === user._id)
      const haveIsaved = ME.SavedArticles.some(savedArt => savedArt.article.toString() === thisArticle._id.toString())
      const isAuthor = (thisArticle.user.toString() === user._id.toString())

      const ThatArticle = Object.assign(thisArticle, {haveIcommented, haveIsaved, isAuthor})
      return ThatArticle
    } catch (error) {
      throw error
    }
  },
  getArticles: async (_,args, {user}) => {
    try {
      // await requireAuth(user)
      const a = await Article.find({}).sort({ createdAt: -1})
      console.log('not what u expected huh ? ', a.length)
      return a
    } catch (error) {
      throw error
    }
  },
  getUserArticles: async (_,{_id}, {user}) => {
    try {
      const ME = await requireAuth(user)
      const results = []
      const TheseArticles = await Article.find({user: _id})
      TheseArticles.forEach(art => {
        const haveIsaved = ME.SavedArticles.some(savedArt => savedArt.article.toString() === art._id.toString())
        const ThatArticle = Object.assign(art, {haveIsaved})
        results.push(ThatArticle)
      })
      return results
    } catch (error) {
      throw error
    }
  },
  createArticle: async (_, {tags,Picture, ...rest}, {user}) => {
    try {
      await requireAuth(user);
      tags.forEach(async item => {
        const wtf = await Tag.findOne({title: item})
        if(!wtf) {
          await Tag.create({title: item})
        }
      })
      const a = Math.floor(Date.now() / 1000)
      const myFileName = `${user._id}${a}`
      const { stream, filename } = await Picture
      await ArticlePictureUpload({stream, filename, myFileName})
      const thisArticle = await Article.create({tags , Picture: `http://10.0.2.2:2999/ArticleRelated/${myFileName}.jpg`,...rest, user: user._id})
      await User.findOneAndUpdate({_id: user._id}, {$push: {UserArticles: {article : thisArticle._id.toString()}}})
      return thisArticle
    } catch (error) {
      throw error
    }
  },
  updateArticle: async (_,{_id, ...rest}, {user}) => {
    try {
      await requireAuth(user);
      const article = await Article.findOne({ _id, user: user._id});

      if (!article) {
        throw new Error('Not Found')
      }

      Object.entries(rest).forEach(([key,value]) => {
        article[key] = value
      })

      return article.save();
    } catch (error) {
      throw error
    }
  },
  deleteArticle: async (_, {_id}, {user}) => {
    try {
      await requireAuth(user);
      const article = await Article.findOne({ _id})

      if (!article) {
        throw new Error('Not Found!')
      }

      if (article.user.toString() !== user._id.toString()) {
        throw new Error('UnAthorized')
      }

      await User.findOneAndUpdate({_id: user._id}, {$pull: {"UserArticles": {article: _id}}})

      const AllUsers = await User.find({})

      await asyncForEach(AllUsers, async thisUser => {
        const isItThere = thisUser.SavedArticles.some(savedArt => savedArt.article.toString() === _id.toString()) 

        if(!isItThere) return 

        await User.findOneAndUpdate({_id: thisUser._id}, {$pull: {"SavedArticles": {article: _id}}})
        
      })

      await article.remove();
      return {
        message: 'Delete Successful'
      }
    } catch (error) {
      throw error;
    }
  },
  addReview: async (_, {_id, review, point}, {user}) => {
    try {
      await requireAuth(user);
      const article = await Article.findById(_id);

      if (!article) {
        throw new Error ('Not Found!')
      }

      const alreadyCommented = article.Reviews.some(review => review.user === user._id)

      if (alreadyCommented) {
        throw new Error ('Already Commented')
      }

      await Article.findOneAndUpdate({_id}, {$push: { "Reviews": {user: user._id, review, point}}})

      const thisArticle = await Article.findById(_id)

      const Point = thisArticle.Reviews.reduce((total, current) => {
        return total + current.point
      }, 0)
      const PointAverage = Point / thisArticle.Reviews.length

      await Article.findOneAndUpdate({_id},{$set: {"PointAverage": PointAverage}})

      return {
        message: 'Comment Successfully Added'
      }
    } catch (error) {
      throw error
    }
  },
  getSelectedArticlesbyTags: async (_, args, {user}) => {
    try {
      const ME = await requireAuth(user);
      const results = []

      await asyncForEach(ME.FavoriteFields, async item => {
        const theseArticles = await Article.find({tags: item}).sort({createdAt: -1})

        theseArticles.forEach(article => {
          if(!article) return
          
          const AmIthere = results.some(jix => jix._id.toString() === article._id.toString())
          
          if(AmIthere) {
            results.forEach((art, i) => {
              if (art._id.toString() === article._id.toString()) {
                art.because.push(item)
              }
            })
            return
          }

          const haveIsaved = ME.SavedArticles.some(savedArt => {
            return savedArt.article.toString() === article._id.toString()
          })
          
          const thatArticle = Object.assign(article, {because: [item], haveIsaved})
          results.push(thatArticle)

        })
      })
      // results.sort({createdAt: -1})
      // console.log(results)
      return results
    } catch (error) {
      throw error
    }
  },
  getSelectedArticlesByUsers: async (_,args, {user}) => {
    try {
      const ME = await requireAuth(user)
      const results = []

      await asyncForEach(ME.following, async User => {
        const theseArticles = await Article.find({user: User.user})
        
        theseArticles.forEach(art => {

          const haveIsaved = ME.SavedArticles.some(savedArt => savedArt.article.toString() === art._id.toString())

          const ThatArticle = Object.assign(art, {haveIsaved})
          results.push(ThatArticle)
        })
      })
      return results
    } catch (error) {
      throw error
    }
  },
  getArticlesBySpeceficTag: async (_, {tag}, {user}) => {
    try {
      const ME = await requireAuth(user)
      const results = []
      const TheseArticles = await Article.find({tags: tag}).sort({createdAt: -1})

      TheseArticles.forEach(art => {
        const haveIsaved = ME.SavedArticles.some(savedArt => savedArt.article.toString() === art._id.toString())
        const ThatArticle = Object.assign(art, {haveIsaved})
        results.push(ThatArticle)
      })

      return results
    } catch(error) {
      throw error
    }
  },
  HandleSaveArticle: async (_ , {_id}, {user}) => {
    try {
      await requireAuth(user)

      const thisUser = await User.findOne({_id: user._id}) 

      const haveIsaved = thisUser.SavedArticles.some(art => art.article === _id)

      if(haveIsaved) {
        await User.findOneAndUpdate({_id: user._id} , {$pull: {"SavedArticles" : {article: _id}}})
      } else {
        await User.findOneAndUpdate({_id: user._id} , {$push: {"SavedArticles" : {article: _id}}})
      }


      return {
        message: 'Success!'
      }
    } catch (error) {
      throw error
    }
  },
  getSavedArticles: async (_, args, {user}) => {
    try {
      const ME = await requireAuth(user)
      return ME.SavedArticles
    } catch (error) {
      throw error
    }
  }
}