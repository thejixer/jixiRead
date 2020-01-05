import mongoose, {Schema} from 'mongoose';

// MONGODB SCHEMA 
const ArticleSchema = new Schema({
  title: String,
  text: {
    type: String,   
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  Reviews: Array,
  tags: Array,
  Picture: String,
  PointAverage: {
    type: Number,
    default: 0
  }
}, {timestamps: true})

export default mongoose.model('Article', ArticleSchema);