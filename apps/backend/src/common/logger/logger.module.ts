import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import type { IncomingMessage, ServerResponse } from 'http';
import type { Options } from 'pino-http';

const isProduction = process.env['NODE_ENV'] === 'production';

// Define the pino-http options separately for proper typing
const pinoHttpOptions: Options<IncomingMessage, ServerResponse> = {
  // Production uses JSON format automatically
  // LOG_LEVEL is optional (defaults to 'info') - validated in env.ts
  level: process.env['LOG_LEVEL'] || 'info',
  // Custom log format
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  // Add custom fields to all logs
  customProps: () => ({
    service: 'logarr-api',
  }),
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.apiKey', '*.password'],
    remove: true,
  },
  // Auto-log request/response
  autoLogging: {
    ignore: (req) => {
      // Don't log health check endpoints
      const url = req.url;
      return url === '/api' || url === '/api/health';
    },
  },
};

// Add transport for development (pretty printing)
if (!isProduction) {
  pinoHttpOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: false,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: pinoHttpOptions,
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
