import faker from 'faker'

import Article from '../models/Article'
import User from '../models/User'
import Tag from '../models/Tag'

const Article_Total = 0
const USER_TOTAL = 0

export default async () => {
  try {
    await Article.remove()
    await User.remove()
    await Tag.remove()
  } catch (error) {
    throw error;
  }
}