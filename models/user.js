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


// Middleware pour deleteOne avec document = true
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Supprimer les Posts de l'utilisateur
    await Post.deleteMany({ user: this._id });
    console.log(`Posts supprimés pour l'utilisateur ${this.username}`);
    
    // Supprimer les Subscriptions de l'utilisateur
    await Subscription.deleteMany({ userId: this._id });
    console.log(`Subscriptions supprimées pour l'utilisateur ${this.username}`);
    
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression des données liées:', error);
    next(error);
  }
});

// Middleware pour findOneAndDelete
userSchema.pre('findOneAndDelete', async function(next) {
  try {
    const user = await this.model.findOne(this.getQuery());
    if (user) {
      // Supprimer les Posts de l'utilisateur
      await Post.deleteMany({ user: user._id });
      console.log(`Posts supprimés pour l'utilisateur ${user.username}`);
      
      // Supprimer les Subscriptions de l'utilisateur
      await Subscription.deleteMany({ userId: user._id });
      console.log(`Subscriptions supprimées pour l'utilisateur ${user.username}`);
    }
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression des données liées:', error);
    next(error);
  }
});

// Middleware pour deleteMany (si vous supprimez plusieurs utilisateurs)
userSchema.pre('deleteMany', async function(next) {
  try {
    const users = await this.model.find(this.getQuery());
    const userIds = users.map(user => user._id);
    
    if (userIds.length > 0) {
      // Supprimer tous les Posts des utilisateurs
      await Post.deleteMany({ user: { $in: userIds } });
      console.log(`Posts supprimés pour ${userIds.length} utilisateurs`);
      
      // Supprimer toutes les Subscriptions des utilisateurs
      await Subscription.deleteMany({ userId: { $in: userIds } });
      console.log(`Subscriptions supprimées pour ${userIds.length} utilisateurs`);
    }
    
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression des données liées:', error);
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;