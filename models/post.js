const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  description: { type: String, required: true, default: "" },
  tags: { type: [String], required: false, default: [] },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: { type: [String], required: true, default: [] },
  likes: { type: Number, required: true, default: 0 },
  isDeactivated: { type: Boolean, required: true, default: false }
}, { timestamps: true });

// Transform output (toJSON)
postSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
