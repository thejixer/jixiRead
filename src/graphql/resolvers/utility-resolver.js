import { requireAuth } from '../../services/auth'
import Tag from '../../models/Tag'

export default {
  tagAutoComplete: async (_, {text}, {user}) => {
    await requireAuth(user)
    const TheseTags = await Tag.find({"title" : {$regex : text, $options: 'i'}})
    return TheseTags.slice(0,5)
  },
  test: () => {
    const a = Math.floor(Date.now() / 1000)
    return a
  }
}