const mongoose = require('mongoose');

const premiumSchema = new mongoose.Schema({
  title: { type: String, required: true, default: "" },
  tarif: {type: Number, required: true, default: 999},
  description: { type: String, required: true, default: "" },
  subCount: {type: Number, required: true, default: 0},
  priorityId: {type: Number, required: true, default: 0},
}, { timestamps: true });

// Méthode statique pour recalculer le subCount d'un premium
premiumSchema.statics.updateSubCount = async function(premiumId) {
  const Subscription = mongoose.model('Subscription');
  
  const count = await Subscription.countDocuments({
    premium: premiumId,
    status: 'active'
  });
  
  await this.findByIdAndUpdate(premiumId, { subCount: count });
  return count;
};

premiumSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Premium = mongoose.model('Premium', premiumSchema);
module.exports = Premium;