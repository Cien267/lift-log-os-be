import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerification1791432706259 implements MigrationInterface {
    name = 'AddEmailVerification1791432706259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."auth_tokens_type_enum" AS ENUM('email_verification', 'password_reset')`);
        await queryRunner.query(`CREATE TABLE "auth_tokens" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."auth_tokens_type_enum" NOT NULL, "token_hash" character(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_auth_tokens_user_type" ON "auth_tokens"  ("user_id", "type", "created_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_auth_tokens_hash" ON "auth_tokens"  ("token_hash") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_9691367d446cd8b18f462c191b3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_9691367d446cd8b18f462c191b3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified_at"`);
        await queryRunner.query(`DROP INDEX "public"."uq_auth_tokens_hash"`);
        await queryRunner.query(`DROP INDEX "public"."idx_auth_tokens_user_type"`);
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."auth_tokens_type_enum"`);
    }

}
