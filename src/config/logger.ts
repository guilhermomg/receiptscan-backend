import winston from 'winston';
import config from './index';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, requestId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;

  if (requestId) {
    msg += ` [${requestId}]`;
  }

  msg += `: ${message}`;

  // Add metadata if exists
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  defaultMeta: { service: 'receiptscan-backend' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),
  ],
});

// Add file transports in production
if (config.nodeEnv === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), winston.format.json()),
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), winston.format.json()),
    })
  );
}

export default logger;
