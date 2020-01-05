import mongoose, {Schema} from 'mongoose';

// MONGODB SCHEMA 
const TagSchema = new Schema({
  title: String
})

export default mongoose.model('Tag', TagSchema);