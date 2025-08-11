const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    premium: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Premium',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active',
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'other'],
      default: 'credit_card',
    },
    transactionId: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
    },
    factureUrl: {
      type: String,
      default: null,
      required: false,
    },
  },
  { timestamps: true }
);

/** 🔍 Index pour optimiser les requêtes */
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ premium: 1 });
subscriptionSchema.index({ endDate: 1 });

/** 🔄 Auto-population du champ premium */
subscriptionSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'premium',
    select: '-__v',
  });
  next();
});

/** ✅ Méthode pour vérifier si la subscription est active */
subscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && this.endDate > new Date();
};

/** 📅 Méthode pour calculer les jours restants */
subscriptionSchema.methods.getDaysRemaining = function () {
  if (this.endDate <= new Date()) return 0;
  const diffTime = this.endDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/** ⏳ Middleware pour mettre à jour automatiquement le statut */
subscriptionSchema.pre('save', function (next) {
  if (this.endDate <= new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

/** 🌐 Transformation JSON */
subscriptionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
