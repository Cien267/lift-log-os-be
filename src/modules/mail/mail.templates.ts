const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const layout = (heading: string, bodyHtml: string): string => `<!doctype html>
<html lang="vi">
  <body style="margin:0;padding:24px;background:#0b0f0c;font-family:Arial,Helvetica,sans-serif;color:#e6ece7;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#141a16;border-radius:12px;padding:32px;">
      <tr><td>
        <div style="font-size:20px;font-weight:700;color:#3ddc84;margin-bottom:16px;">Forge</div>
        <h1 style="font-size:18px;margin:0 0 16px;">${escapeHtml(heading)}</h1>
        ${bodyHtml}
      </td></tr>
    </table>
  </body>
</html>`;

const button = (href: string, label: string): string =>
  `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="background:#3ddc84;color:#0b0f0c;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;display:inline-block;">${escapeHtml(label)}</a></p>`;

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export function verificationEmail(
  name: string,
  link: string,
  ttlHours: number,
): RenderedEmail {
  return {
    subject: 'Xác minh email của bạn',
    text: `Chào ${name},\n\nHãy xác minh email bằng liên kết sau (có hiệu lực ${ttlHours} giờ):\n${link}\n\nNếu bạn không tạo tài khoản, hãy bỏ qua email này.`,
    html: layout(
      'Xác minh email của bạn',
      `<p>Chào ${escapeHtml(name)},</p>
       <p>Nhấn nút bên dưới để xác minh email. Liên kết có hiệu lực ${ttlHours} giờ.</p>
       ${button(link, 'Xác minh email')}
       <p style="color:#8a948d;font-size:13px;">Nếu bạn không tạo tài khoản, hãy bỏ qua email này.</p>`,
    ),
  };
}

export function passwordResetEmail(
  name: string,
  link: string,
  ttlMinutes: number,
): RenderedEmail {
  return {
    subject: 'Đặt lại mật khẩu',
    text: `Chào ${name},\n\nChúng tôi nhận được yêu cầu đặt lại mật khẩu. Dùng liên kết sau (có hiệu lực ${ttlMinutes} phút, chỉ dùng được một lần):\n${link}\n\nNếu không phải bạn yêu cầu, hãy bỏ qua email này, mật khẩu của bạn không thay đổi.`,
    html: layout(
      'Đặt lại mật khẩu',
      `<p>Chào ${escapeHtml(name)},</p>
       <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu. Liên kết có hiệu lực ${ttlMinutes} phút và chỉ dùng được một lần.</p>
       ${button(link, 'Đặt lại mật khẩu')}
       <p style="color:#8a948d;font-size:13px;">Nếu không phải bạn yêu cầu, hãy bỏ qua email này. Mật khẩu của bạn không thay đổi.</p>`,
    ),
  };
}

export function passwordChangedEmail(name: string): RenderedEmail {
  return {
    subject: 'Mật khẩu của bạn đã được thay đổi',
    text: `Chào ${name},\n\nMật khẩu tài khoản của bạn vừa được thay đổi và mọi thiết bị đã bị đăng xuất.\nNếu không phải bạn, hãy đặt lại mật khẩu ngay và liên hệ hỗ trợ.`,
    html: layout(
      'Mật khẩu đã được thay đổi',
      `<p>Chào ${escapeHtml(name)},</p>
       <p>Mật khẩu tài khoản của bạn vừa được thay đổi và mọi thiết bị đã bị đăng xuất.</p>
       <p style="color:#8a948d;font-size:13px;">Nếu không phải bạn, hãy đặt lại mật khẩu ngay và liên hệ hỗ trợ.</p>`,
    ),
  };
}
