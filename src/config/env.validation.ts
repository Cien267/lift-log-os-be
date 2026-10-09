import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().default(3000),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),

    JWT_SECRET: z.string().min(32),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    // z.coerce.boolean() coi mọi chuỗi không rỗng (kể cả "false") là true, nên dùng enum.
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),

    // URL của front-end, dùng để dựng liên kết trong email.
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    EMAIL_VERIFICATION_TTL_HOURS: z.coerce
      .number()
      .int()
      .positive()
      .default(24),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),

    MAIL_TRANSPORT: z.enum(['console', 'smtp']).default('console'),
    MAIL_FROM: z.string().min(3).default('Forge <no-reply@forge.local>'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.MAIL_TRANSPORT === 'smtp' && !env.SMTP_HOST) {
      ctx.addIssue({
        code: 'custom',
        path: ['SMTP_HOST'],
        message: 'Bắt buộc khi MAIL_TRANSPORT=smtp',
      });
    }
    if (env.NODE_ENV === 'production') {
      if (env.MAIL_TRANSPORT === 'console') {
        ctx.addIssue({
          code: 'custom',
          path: ['MAIL_TRANSPORT'],
          message:
            'Production không được dùng "console" (liên kết đặt lại mật khẩu sẽ bị ghi vào log)',
        });
      }
      if (!env.FRONTEND_URL.startsWith('https://')) {
        ctx.addIssue({
          code: 'custom',
          path: ['FRONTEND_URL'],
          message: 'Production phải dùng https',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Biến môi trường không hợp lệ:\n${JSON.stringify(result.error.format(), null, 2)}`,
    );
  }
  return result.data;
}
