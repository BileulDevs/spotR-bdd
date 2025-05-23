const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  provider: { type: String, required: true },
  password: {
    type: String,
    required: () => {
      return this.provider === 'local';
    }
  },
  isAdmin: { type: Boolean, required: true, default: false},
  isEmailVerified: { type: Boolean, required: true, default: false},
  emailVerifiedAt: { type: Date, default: null },
  avatar: { type: String, default: null}
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
