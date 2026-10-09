import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { MailMessage, MailTransport } from '../mail-transport';

export class SmtpMailTransport extends MailTransport {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    super();
    this.from = config.getOrThrow<string>('MAIL_FROM');
    const user = config.get<string>('SMTP_USER');
    this.transporter = createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: config.getOrThrow<number>('SMTP_PORT'),
      secure: config.getOrThrow<boolean>('SMTP_SECURE'),
      auth: user ? { user, pass: config.get<string>('SMTP_PASS') } : undefined,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
