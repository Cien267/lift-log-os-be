import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class AuditEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
