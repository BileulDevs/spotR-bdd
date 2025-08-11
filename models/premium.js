const mongoose = require('mongoose');

const premiumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, default: '' },
    tarif: { type: Number, required: true, default: 999 },
    description: { type: String, required: true, default: '' },
    subCount: { type: Number, required: true, default: 0 },
    priorityId: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

premiumSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Premium = mongoose.model('Premium', premiumSchema);
module.exports = Premium;
