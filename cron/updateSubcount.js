const cron = require('node-cron');
const logger = require("../config/logger");
const Premium = require('../models/premium');
const Subscription = require('../models/subscription');

// Toutes les heures on recompte le nb de sub à un plan premium
cron.schedule('0 * * * *', async () => {
  try {
    const premiums = await Premium.find({});
    let updated = 0;

    for (const premium of premiums) {
      const count = await Subscription.countDocuments({
        premium: premium._id,
        status: 'active',
        endDate: { $gt: new Date() }
      });

      const result = await Premium.updateOne(
        { _id: premium._id },
        { $set: { subCount: count } }
      );

      if (result.modifiedCount > 0) {
        updated++;
        console.log(`[CRON] ${premium.title} mis à jour : ${count} abonnés actifs.`);
      }
    }

    logger.info(`[CRON] ${updated} premium(s) mis à jour avec leur subCount.`);
  } catch (err) {
    logger.error('[CRON] Erreur lors de la mise à jour des subCount :', err);
    console.error('[CRON] Erreur lors de la mise à jour des subCount :', err);
  }
});
