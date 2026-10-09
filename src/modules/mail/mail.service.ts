import { Injectable } from '@nestjs/common';
import { MailTransport } from './mail-transport';
import {
  passwordChangedEmail,
  passwordResetEmail,
  verificationEmail,
} from './mail.templates';

interface Recipient {
  email: string;
  name: string;
}

@Injectable()
export class MailService {
  constructor(private readonly transport: MailTransport) {}

  sendVerificationEmail(
    to: Recipient,
    link: string,
    ttlHours: number,
  ): Promise<void> {
    return this.transport.send({
      to: to.email,
      ...verificationEmail(to.name, link, ttlHours),
    });
  }

  sendPasswordResetEmail(
    to: Recipient,
    link: string,
    ttlMinutes: number,
  ): Promise<void> {
    return this.transport.send({
      to: to.email,
      ...passwordResetEmail(to.name, link, ttlMinutes),
    });
  }

  sendPasswordChangedNotice(to: Recipient): Promise<void> {
    return this.transport.send({
      to: to.email,
      ...passwordChangedEmail(to.name),
    });
  }
}
