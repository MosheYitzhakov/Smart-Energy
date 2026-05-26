import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(
              ({
                timestamp,
                level,
                message,
                context,
                ...meta
              }: winston.Logform.TransformableInfo & {
                timestamp?: string;
                context?: string;
              }) => {
                const ctx = context ? `[${context}]` : '';
                const extras = Object.keys(meta).length
                  ? ` ${JSON.stringify(meta)}`
                  : '';
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                return `${timestamp ?? ''} ${level} ${ctx} ${message}${extras}`;
              },
            ),
          ),
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
