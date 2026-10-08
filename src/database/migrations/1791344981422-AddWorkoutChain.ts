import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkoutChain1791344981422 implements MigrationInterface {
    name = 'AddWorkoutChain1791344981422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "workout_sets" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "workout_exercise_id" uuid NOT NULL, "exercise_id" uuid NOT NULL, "weight" numeric(7,2) NOT NULL DEFAULT '0', "reps" smallint NOT NULL DEFAULT '0', "duration_min" numeric(6,2), "rir" smallint, "rpe" numeric(3,1), "rest_time" integer, "completed" boolean NOT NULL DEFAULT false, "is_warmup" boolean NOT NULL DEFAULT false, "notes" text, "performed_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "chk_sets_rpe" CHECK ("rpe" IS NULL OR "rpe" BETWEEN 0 AND 10), CONSTRAINT "chk_sets_rir" CHECK ("rir" IS NULL OR "rir" BETWEEN 0 AND 10), CONSTRAINT "chk_sets_duration" CHECK ("duration_min" IS NULL OR "duration_min" >= 0), CONSTRAINT "chk_sets_reps" CHECK ("reps" >= 0), CONSTRAINT "chk_sets_weight" CHECK ("weight" >= 0), CONSTRAINT "PK_5ad75c97e58e8c660a48926d438" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sets_user_exercise_performed" ON "workout_sets"  ("user_id", "exercise_id", "performed_at") WHERE "completed" = true AND "is_warmup" = false`);
        await queryRunner.query(`CREATE INDEX "idx_sets_workout_exercise" ON "workout_sets"  ("workout_exercise_id") `);
        await queryRunner.query(`CREATE TABLE "workout_exercises" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "workout_id" uuid NOT NULL, "exercise_id" uuid NOT NULL, "position" integer NOT NULL, "rest_preset" integer, "notes" text, "superset_group" smallint, "target_sets" smallint, CONSTRAINT "PK_377f9ead6fd69b29f0d0feb1028" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_workout_exercises_user_exercise" ON "workout_exercises"  ("user_id", "exercise_id") `);
        await queryRunner.query(`CREATE INDEX "idx_workout_exercises_workout_position" ON "workout_exercises"  ("workout_id", "position") `);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "end_time" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "duration_sec" integer`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "mood" smallint`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "energy_level" smallint`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "total_volume" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "total_cardio_min" numeric(8,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "estimated_calories" integer`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "insight" jsonb`);
        await queryRunner.query(`CREATE INDEX "idx_workouts_user_date" ON "workouts"  ("user_id", "date") `);
        await queryRunner.query(`ALTER TABLE "workouts" ADD CONSTRAINT "chk_workouts_duration" CHECK ("duration_sec" IS NULL OR "duration_sec" >= 0)`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD CONSTRAINT "chk_workouts_energy" CHECK ("energy_level" BETWEEN 1 AND 5)`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD CONSTRAINT "chk_workouts_mood" CHECK ("mood" BETWEEN 1 AND 5)`);
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_3ae2447b1ad6a22ef2c3a3c559f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_1f6afffea13fac2595347de1dd1" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_9a3b700413f3f5c26ee17daabd1" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" ADD CONSTRAINT "FK_fc7dda3a0aa5160c9d02e204b59" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" ADD CONSTRAINT "FK_7e6040e931b008308aaddbb7d32" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" ADD CONSTRAINT "FK_9a0656f321d9a96de2eb685e85a" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workout_exercises" DROP CONSTRAINT "FK_9a0656f321d9a96de2eb685e85a"`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" DROP CONSTRAINT "FK_7e6040e931b008308aaddbb7d32"`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" DROP CONSTRAINT "FK_fc7dda3a0aa5160c9d02e204b59"`);
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_9a3b700413f3f5c26ee17daabd1"`);
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_1f6afffea13fac2595347de1dd1"`);
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_3ae2447b1ad6a22ef2c3a3c559f"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP CONSTRAINT "chk_workouts_mood"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP CONSTRAINT "chk_workouts_energy"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP CONSTRAINT "chk_workouts_duration"`);
        await queryRunner.query(`DROP INDEX "public"."idx_workouts_user_date"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "insight"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "estimated_calories"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "total_cardio_min"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "total_volume"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "energy_level"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "mood"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "duration_sec"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "end_time"`);
        await queryRunner.query(`DROP INDEX "public"."idx_workout_exercises_workout_position"`);
        await queryRunner.query(`DROP INDEX "public"."idx_workout_exercises_user_exercise"`);
        await queryRunner.query(`DROP TABLE "workout_exercises"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sets_workout_exercise"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sets_user_exercise_performed"`);
        await queryRunner.query(`DROP TABLE "workout_sets"`);
    }

}
