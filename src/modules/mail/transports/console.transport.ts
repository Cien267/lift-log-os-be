import { Logger } from '@nestjs/common';
import { MailMessage, MailTransport } from '../mail-transport';

/** Chỉ dùng khi phát triển: in nội dung email ra log thay vì gửi thật. */
export class ConsoleMailTransport extends MailTransport {
  private readonly logger = new Logger('Mail');

  send(message: MailMessage): Promise<void> {
    this.logger.log(
      `\n--- EMAIL (console) ---\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n-----------------------`,
    );
    return Promise.resolve();
  }
}
