const cron = require('node-cron');
const Subscription = require('../models/subscription');
const logger = require("../config/logger");

// toutes les heures piles
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();

    const result = await Subscription.updateMany(
      { status: 'active', endDate: { $lte: now } },
      { $set: { status: 'expired' } }
    );
    
    logger.info(`[CRON] ${result.modifiedCount} abonnements expirés ont été mis à jour.`);
    console.log(`[CRON] ${result.modifiedCount} abonnements expirés ont été mis à jour.`);

  } catch (err) {
    logger.error('[CRON] Erreur lors de la mise à jour des abonnements :', err);
    console.error('[CRON] Erreur lors de la mise à jour des abonnements :', err);
  }
});
