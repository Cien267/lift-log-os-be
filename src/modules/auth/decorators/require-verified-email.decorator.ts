import { UseGuards } from '@nestjs/common';
import { VerifiedEmailGuard } from '../guards/verified-email.guard';

/** Gắn lên controller hoặc route cần email đã xác minh. Module chứa nó phải import UsersModule. */
export const RequireVerifiedEmail = () => UseGuards(VerifiedEmailGuard);
