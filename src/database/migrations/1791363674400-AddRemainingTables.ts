import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRemainingTables1791363674400 implements MigrationInterface {
    name = 'AddRemainingTables1791363674400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "body_measurements" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "date" date NOT NULL, "weight" numeric(5,2), "height" numeric(5,1), "body_fat" numeric(4,1), "chest" numeric(5,1), "waist" numeric(5,1), "arm" numeric(5,1), "thigh" numeric(5,1), "shoulder" numeric(5,1), "hip" numeric(5,1), "notes" text, CONSTRAINT "chk_measurements_weight" CHECK ("weight" IS NULL OR "weight" > 0), CONSTRAINT "PK_474282e620ea0cd4fe5d8cbce0f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_measurements_user_updated" ON "body_measurements"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_measurements_user_date" ON "body_measurements"  ("user_id", "date") `);
        await queryRunner.query(`CREATE TYPE "public"."progress_photos_angle_enum" AS ENUM('front', 'side', 'back')`);
        await queryRunner.query(`CREATE TABLE "progress_photos" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "date" date NOT NULL, "storage_key" character varying(255) NOT NULL, "thumb_key" character varying(255) NOT NULL, "mime_type" character varying(50) NOT NULL, "size_bytes" integer NOT NULL, "angle" "public"."progress_photos_angle_enum", "notes" text, CONSTRAINT "PK_5396497e4283c10ac55ad4c9e7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_photos_user_updated" ON "progress_photos"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_photos_user_date" ON "progress_photos"  ("user_id", "date") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('whats_new', 'weekly_summary')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "key" character varying(100), "title" character varying(200) NOT NULL, "subtitle" character varying(500), "payload" jsonb, "is_read" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_notifications_user_key" ON "notifications"  ("user_id", "key") WHERE "key" IS NOT NULL AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_updated" ON "notifications"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_inbox" ON "notifications"  ("user_id", "is_read", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."personal_records_type_enum" AS ENUM('weight', 'reps', 'volume', 'e1rm', 'duration')`);
        await queryRunner.query(`CREATE TABLE "personal_records" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "exercise_id" uuid NOT NULL, "type" "public"."personal_records_type_enum" NOT NULL, "value" numeric(10,2) NOT NULL, "weight" numeric(7,2), "reps" integer, "date" date NOT NULL, "workout_id" uuid NOT NULL, CONSTRAINT "PK_ba9cfbd0af0e7e81265ea1b72a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_prs_user_updated" ON "personal_records"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_prs_workout" ON "personal_records"  ("workout_id") `);
        await queryRunner.query(`CREATE INDEX "idx_prs_user_date" ON "personal_records"  ("user_id", "date") `);
        await queryRunner.query(`CREATE INDEX "idx_prs_user_exercise_type_value" ON "personal_records"  ("user_id", "exercise_id", "type", "value") `);
        await queryRunner.query(`CREATE TABLE "recovery_logs" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "date" date NOT NULL, "soreness_by_group" jsonb, "sleep_hours" numeric(3,1), "sleep_quality" smallint, "fatigue" smallint, "notes" text, CONSTRAINT "chk_recovery_fatigue" CHECK ("fatigue" IS NULL OR "fatigue" BETWEEN 1 AND 5), CONSTRAINT "chk_recovery_sleep_quality" CHECK ("sleep_quality" IS NULL OR "sleep_quality" BETWEEN 1 AND 5), CONSTRAINT "chk_recovery_sleep_hours" CHECK ("sleep_hours" IS NULL OR "sleep_hours" BETWEEN 0 AND 24), CONSTRAINT "PK_5f266352f208cf68409bbe96c2c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_recovery_user_updated" ON "recovery_logs"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_recovery_user_date" ON "recovery_logs"  ("user_id", "date") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TYPE "public"."user_settings_unit_enum" AS ENUM('kg', 'lb')`);
        await queryRunner.query(`CREATE TYPE "public"."user_settings_theme_enum" AS ENUM('dark', 'light', 'system')`);
        await queryRunner.query(`CREATE TYPE "public"."user_settings_language_enum" AS ENUM('en', 'vi')`);
        await queryRunner.query(`CREATE TYPE "public"."user_settings_available_equipment_enum" AS ENUM('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'pullup-bar', 'bench', 'other')`);
        await queryRunner.query(`CREATE TABLE "user_settings" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "unit" "public"."user_settings_unit_enum" NOT NULL DEFAULT 'kg', "theme" "public"."user_settings_theme_enum" NOT NULL DEFAULT 'dark', "language" "public"."user_settings_language_enum" NOT NULL DEFAULT 'en', "default_rest" integer NOT NULL DEFAULT '90', "notifications_enabled" boolean NOT NULL DEFAULT true, "available_equipment" "public"."user_settings_available_equipment_enum" array NOT NULL DEFAULT '{}', "weekly_goal" smallint, "target_weight" numeric(5,2), "training_assistant" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_4ed056b9344e6f7d8d46ec4b302" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`ALTER TABLE "body_measurements" ADD CONSTRAINT "FK_60c6f60b730f556932709f6b0b7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "progress_photos" ADD CONSTRAINT "FK_2ab828794cb4725415334c0cb6e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "personal_records" ADD CONSTRAINT "FK_da8a9e883885f86c116e85bbf50" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "personal_records" ADD CONSTRAINT "FK_2ebd827bd20fb60161f3a97f5cb" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "personal_records" ADD CONSTRAINT "FK_5b0b1388c114c22f5b542d6fcd2" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recovery_logs" ADD CONSTRAINT "FK_8e596d14a50c732bd9783a684b4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_settings" ADD CONSTRAINT "FK_4ed056b9344e6f7d8d46ec4b302" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" DROP CONSTRAINT "FK_4ed056b9344e6f7d8d46ec4b302"`);
        await queryRunner.query(`ALTER TABLE "recovery_logs" DROP CONSTRAINT "FK_8e596d14a50c732bd9783a684b4"`);
        await queryRunner.query(`ALTER TABLE "personal_records" DROP CONSTRAINT "FK_5b0b1388c114c22f5b542d6fcd2"`);
        await queryRunner.query(`ALTER TABLE "personal_records" DROP CONSTRAINT "FK_2ebd827bd20fb60161f3a97f5cb"`);
        await queryRunner.query(`ALTER TABLE "personal_records" DROP CONSTRAINT "FK_da8a9e883885f86c116e85bbf50"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "progress_photos" DROP CONSTRAINT "FK_2ab828794cb4725415334c0cb6e"`);
        await queryRunner.query(`ALTER TABLE "body_measurements" DROP CONSTRAINT "FK_60c6f60b730f556932709f6b0b7"`);
        await queryRunner.query(`DROP TABLE "user_settings"`);
        await queryRunner.query(`DROP TYPE "public"."user_settings_available_equipment_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_settings_language_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_settings_theme_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_settings_unit_enum"`);
        await queryRunner.query(`DROP INDEX "public"."uq_recovery_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_recovery_user_updated"`);
        await queryRunner.query(`DROP TABLE "recovery_logs"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prs_user_exercise_type_value"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prs_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prs_workout"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prs_user_updated"`);
        await queryRunner.query(`DROP TABLE "personal_records"`);
        await queryRunner.query(`DROP TYPE "public"."personal_records_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_inbox"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_updated"`);
        await queryRunner.query(`DROP INDEX "public"."uq_notifications_user_key"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_photos_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_photos_user_updated"`);
        await queryRunner.query(`DROP TABLE "progress_photos"`);
        await queryRunner.query(`DROP TYPE "public"."progress_photos_angle_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_measurements_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_measurements_user_updated"`);
        await queryRunner.query(`DROP TABLE "body_measurements"`);
    }

}
