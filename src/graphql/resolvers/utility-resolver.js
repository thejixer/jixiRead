import { requireAuth } from '../../services/auth'
import Tag from '../../models/Tag'

export default {
  // helps with User Searchs
  // Normally it should be a Query Not A mutation, but I Think it is more efficient this way
  // regarding the Front End Aspects of the Usage of this Resolver
  tagAutoComplete: async (_, { text }, { user }) => {
    // check if the user is Authenticated
    await requireAuth(user)
    // find All Tags that include the text given to the server by the user
    const TheseTags = await Tag.find({ "title": { $regex: text, $options: 'i' } })
    // just give back 5 of them to the User
    return TheseTags.slice(0,5)
  },
}