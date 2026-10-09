import 'reflect-metadata';
import { UserRole } from '../../common/enums/forge.enums';
import { User } from '../../modules/users/entities/user.entity';
import dataSource from '../data-source';

/**
 * Đặt vai trò cho một user từ dòng lệnh. Đây là cách DUY NHẤT để tạo admin đầu tiên:
 * không có endpoint công khai nào làm được việc này.
 *
 * Cách dùng: npm run user:set-role -- <email> <user|admin>
 */
async function main(): Promise<void> {
  const [email, role] = process.argv.slice(2);
  if (!email || !Object.values(UserRole).includes(role as UserRole)) {
    console.error('Cách dùng: npm run user:set-role -- <email> <user|admin>');
    process.exitCode = 1;
    return;
  }

  await dataSource.initialize();
  try {
    const result = await dataSource
      .getRepository(User)
      .update(
        { email: email.trim().toLowerCase() },
        { role: role as UserRole },
      );
    if (!result.affected) {
      console.error(`Không tìm thấy user với email ${email}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Đã đặt vai trò "${role}" cho ${email}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
