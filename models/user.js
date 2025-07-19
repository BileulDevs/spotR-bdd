const mongoose = require('mongoose');
const Post = require('./post');
const Subscription = require('./subscription');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  provider: { type: String, required: true },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local';
    }
  },
  isAdmin: { type: Boolean, required: true, default: false},
  isEmailVerified: { type: Boolean, required: true, default: false},
  emailVerifiedAt: { type: Date, default: null },
  avatar: { type: String, default: null},
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
    required: false
  },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Middleware pour supprimer tous les posts de l'utilisateur avant sa suppression
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Supprimer tous les posts de cet utilisateur
    await Post.deleteMany({ user: this._id });
    //await Subscription.deleteMany({ userId: this._id });
    console.log(`Posts supprimés pour l'utilisateur ${this.username}`);
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression des posts:', error);
    next(error);
  }
});

// Middleware pour les suppressions via query (findOneAndDelete, etc.)
userSchema.pre('findOneAndDelete', async function(next) {
  try {
    // Récupérer l'utilisateur qui va être supprimé
    const user = await this.model.findOne(this.getQuery());
    if (user) {
      // Supprimer tous les posts de cet utilisateur
      await Post.deleteMany({ user: user._id });
      //await Subscription.deleteMany({ userId: this._id });
      console.log(`Posts supprimés pour l'utilisateur ${user.username}`);
    }
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression des posts:', error);
    next(error);
  }
});

// Middleware pour les suppressions multiples (optionnel)
userSchema.pre('deleteMany', async function(next) {
  try {
    // Récupérer tous les utilisateurs qui vont être supprimés
    const users = await this.model.find(this.getQuery());
    const userIds = users.map(user => user._id);
    
    if (userIds.length > 0) {
      // Supprimer tous les posts de ces utilisateurs
      await Post.deleteMany({ user: { $in: userIds } });
      //await Subscription.deleteMany({ user: { $in: userIds } });
      console.log(`Posts supprimés pour ${userIds.length} utilisateurs`);
    }
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression des posts:', error);
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;