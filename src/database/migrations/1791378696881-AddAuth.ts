import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuth1791378696881 implements MigrationInterface {
    name = 'AddAuth1791378696881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "family_id" uuid NOT NULL, "token_hash" character(64) NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_used_at" TIMESTAMP WITH TIME ZONE, "revoked_at" TIMESTAMP WITH TIME ZONE, "revoked_reason" character varying(30), "replaced_by_id" uuid, "user_agent" character varying(512), "ip_address" character varying(45), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_family" ON "refresh_tokens"  ("family_id") `);
        await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_user_active" ON "refresh_tokens"  ("user_id") WHERE "revoked_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_refresh_tokens_hash" ON "refresh_tokens"  ("token_hash") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "failed_login_attempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locked_until" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_login_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_changed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_changed_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locked_until"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failed_login_attempts"`);
        await queryRunner.query(`DROP INDEX "public"."uq_refresh_tokens_hash"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_user_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_family"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
