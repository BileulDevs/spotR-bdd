const mongoose = require('mongoose');
const User = require('./user');

const subscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  premium: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Premium', 
    required: true 
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  autoRenew: { 
    type: Boolean, 
    default: true 
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'other'],
    default: 'credit_card'
  },
  transactionId: { 
    type: String, 
    default: "" 
  },
  amount: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

// Index pour optimiser les requêtes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ premium: 1 });
subscriptionSchema.index({ endDate: 1 });

// MIDDLEWARE POUR AUTO-POPULATION
subscriptionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'premium',
    select: '-__v'
  });
  next();
});

// Méthode pour vérifier si la subscription est active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.endDate > new Date();
};

// Méthode pour calculer les jours restants
subscriptionSchema.methods.getDaysRemaining = function() {
  if (this.endDate <= new Date()) return 0;
  const diffTime = this.endDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Middleware pour mettre à jour le statut automatiquement
subscriptionSchema.pre('save', function(next) {
  if (this.endDate <= new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// NOUVEAU: Middleware pour mettre à jour le subCount du Premium
subscriptionSchema.post('save', async function(doc, next) {
  try {
    const User = mongoose.model('User');
    const Premium = mongoose.model('Premium');
    
    // Mettre à jour l'utilisateur avec la subscription
    await User.findByIdAndUpdate(doc.userId, {
      subscription: doc._id
    });
    
    // Mettre à jour le subCount du Premium
    await Premium.updateSubCount(doc.premium);
    
    next();
  } catch (error) {
    next(error);
  }
});

// NOUVEAU: Middleware pour mettre à jour le subCount après modification
subscriptionSchema.post('findOneAndUpdate', async function(doc, next) {
  try {
    if (doc && doc.premium) {
      const Premium = mongoose.model('Premium');
      await Premium.updateSubCount(doc.premium);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// NOUVEAU: Middleware pour mettre à jour le subCount après suppression
subscriptionSchema.post('findOneAndDelete', async function(doc, next) {
  try {
    if (doc && doc.premium) {
      const Premium = mongoose.model('Premium');
      await Premium.updateSubCount(doc.premium);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// NOUVEAU: Middleware pour mettre à jour le subCount après suppression multiple
subscriptionSchema.post('deleteMany', async function(result, next) {
  try {
    // Récupérer tous les Premium uniques et recalculer leur subCount
    const Premium = mongoose.model('Premium');
    const premiums = await Premium.find({});
    
    for (const premium of premiums) {
      await Premium.updateSubCount(premium._id);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

subscriptionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;