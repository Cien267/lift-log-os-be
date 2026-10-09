export const REFRESH_COOKIE_NAME = 'forge_rt';
export const REFRESH_COOKIE_PATH = '/api/auth';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export const JWT_ISSUER = 'forge-api';
export const JWT_AUDIENCE = 'forge-app';

export const INVALID_CREDENTIALS = 'Email hoặc mật khẩu không đúng';
export const INVALID_SESSION = 'Phiên đăng nhập không hợp lệ';

export const ONE_TIME_TOKEN_COOLDOWN_MS = 60 * 1000;
export const INVALID_LINK = 'Liên kết không hợp lệ hoặc đã hết hạn';
export const FORGOT_PASSWORD_MESSAGE =
  'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.';
