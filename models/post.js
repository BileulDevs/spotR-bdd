const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    description: { type: String, required: true, default: '' },
    tags: { type: [String], required: false, default: [] },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    images: { type: [String], required: true, default: [] },
    likes: { type: Number, required: true, default: 0 },
    whoLiked: { type: [String], required: true, default: [] },
    isDeactivated: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

postSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
