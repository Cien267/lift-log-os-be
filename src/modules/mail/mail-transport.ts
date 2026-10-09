export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Lớp trừu tượng để MailService không phụ thuộc cách gửi cụ thể.
 * Dùng abstract class làm token cho DI (interface không tồn tại lúc chạy).
 */
export abstract class MailTransport {
  abstract send(message: MailMessage): Promise<void>;
}
