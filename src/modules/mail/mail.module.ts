import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailTransport } from './mail-transport';
import { MailService } from './mail.service';
import { ConsoleMailTransport } from './transports/console.transport';
import { SmtpMailTransport } from './transports/smtp.transport';

@Module({
  providers: [
    {
      provide: MailTransport,
      inject: [ConfigService],
      useFactory: (config: ConfigService): MailTransport =>
        config.get<string>('MAIL_TRANSPORT') === 'smtp'
          ? new SmtpMailTransport(config)
          : new ConsoleMailTransport(),
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
