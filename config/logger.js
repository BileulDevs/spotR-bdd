const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bdd-service' },
  transports: [
    new winston.transports.File({
      filename: './storage/warnings.log',
      level: 'warn',
    }),
    new winston.transports.File({
      filename: './storage/errors.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: './storage/metrics.log' }),
    new winston.transports.File({ filename: './storage/cron.log' }),
  ],
});

logger.cron = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'cron' });
};

module.exports = logger;
