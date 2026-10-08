import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBaseEntity1791363320165 implements MigrationInterface {
    name = 'AddBaseEntity1791363320165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "template_exercises" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "template_id" uuid NOT NULL, "exercise_id" uuid NOT NULL, "position" integer NOT NULL, "target_sets" smallint NOT NULL, "target_reps_min" smallint, "target_reps_max" smallint, "rest_preset" integer, "superset_group" smallint, CONSTRAINT "chk_template_exercises_reps" CHECK ("target_reps_min" IS NULL OR "target_reps_max" IS NULL OR "target_reps_min" <= "target_reps_max"), CONSTRAINT "chk_template_exercises_sets" CHECK ("target_sets" > 0), CONSTRAINT "PK_8c67b5a9e1eaf3e4f7320349cfd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_template_exercises_user_updated" ON "template_exercises"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_template_exercises_exercise" ON "template_exercises"  ("exercise_id") `);
        await queryRunner.query(`CREATE INDEX "idx_template_exercises_template_position" ON "template_exercises"  ("template_id", "position") `);
        await queryRunner.query(`CREATE TYPE "public"."workout_templates_location_enum" AS ENUM('gym', 'home', 'outdoor')`);
        await queryRunner.query(`CREATE TABLE "workout_templates" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "name" character varying(120) NOT NULL, "description" text, "location" "public"."workout_templates_location_enum" NOT NULL, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_7ef9887437cbf97fefaa93dc6e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_templates_user_updated" ON "workout_templates"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_templates_user_position" ON "workout_templates"  ("user_id", "position") `);
        await queryRunner.query(`CREATE TABLE "exercise_substitutes" ("exercise_id" uuid NOT NULL, "substitute_id" uuid NOT NULL, CONSTRAINT "PK_f103bea7f70bc115a7e505d45db" PRIMARY KEY ("exercise_id", "substitute_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_feb8abdf639b759cc13be0eca9" ON "exercise_substitutes"  ("exercise_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_11bb1fca0f39e46f0da1b8416f" ON "exercise_substitutes"  ("substitute_id") `);
        await queryRunner.query(`ALTER TABLE "exercises" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD "user_id" uuid`);
        await queryRunner.query(`CREATE TYPE "public"."exercises_secondary_muscles_enum" AS ENUM('chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'adductors', 'calves', 'core', 'forearms', 'cardio')`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD "secondary_muscles" "public"."exercises_secondary_muscles_enum" array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD "aliases" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD "guide_image" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD "template_id" uuid`);
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "idx_exercises_user_updated" ON "exercises"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_exercises_muscle_group" ON "exercises"  ("muscle_group") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_exercises_user_name" ON "exercises"  ("user_id", "name") WHERE "user_id" IS NOT NULL AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_exercises_system_name" ON "exercises"  ("name") WHERE "user_id" IS NULL AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "idx_workouts_template" ON "workouts"  ("template_id") `);
        await queryRunner.query(`CREATE INDEX "idx_workouts_user_updated" ON "workouts"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_sets_user_updated" ON "workout_sets"  ("user_id", "updated_at") `);
        await queryRunner.query(`CREATE INDEX "idx_workout_exercises_user_updated" ON "workout_exercises"  ("user_id", "updated_at") `);
        await queryRunner.query(`ALTER TABLE "exercises" ADD CONSTRAINT "FK_d05e8618f5b30e7eb49952a531b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_exercises" ADD CONSTRAINT "FK_391743547d7f719e26964d1efba" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_exercises" ADD CONSTRAINT "FK_a5501e4e4e6dbe58f472eb097c8" FOREIGN KEY ("template_id") REFERENCES "workout_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_exercises" ADD CONSTRAINT "FK_eb57fccdb71c3cc3ed6430f448c" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_templates" ADD CONSTRAINT "FK_7ade528bde7d140c3b9ea582396" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD CONSTRAINT "FK_2fedcb270c15d63a12a59881f6c" FOREIGN KEY ("template_id") REFERENCES "workout_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exercise_substitutes" ADD CONSTRAINT "FK_feb8abdf639b759cc13be0eca95" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "exercise_substitutes" ADD CONSTRAINT "FK_11bb1fca0f39e46f0da1b8416f0" FOREIGN KEY ("substitute_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exercise_substitutes" DROP CONSTRAINT "FK_11bb1fca0f39e46f0da1b8416f0"`);
        await queryRunner.query(`ALTER TABLE "exercise_substitutes" DROP CONSTRAINT "FK_feb8abdf639b759cc13be0eca95"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP CONSTRAINT "FK_2fedcb270c15d63a12a59881f6c"`);
        await queryRunner.query(`ALTER TABLE "workout_templates" DROP CONSTRAINT "FK_7ade528bde7d140c3b9ea582396"`);
        await queryRunner.query(`ALTER TABLE "template_exercises" DROP CONSTRAINT "FK_eb57fccdb71c3cc3ed6430f448c"`);
        await queryRunner.query(`ALTER TABLE "template_exercises" DROP CONSTRAINT "FK_a5501e4e4e6dbe58f472eb097c8"`);
        await queryRunner.query(`ALTER TABLE "template_exercises" DROP CONSTRAINT "FK_391743547d7f719e26964d1efba"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP CONSTRAINT "FK_d05e8618f5b30e7eb49952a531b"`);
        await queryRunner.query(`DROP INDEX "public"."idx_workout_exercises_user_updated"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sets_user_updated"`);
        await queryRunner.query(`DROP INDEX "public"."idx_workouts_user_updated"`);
        await queryRunner.query(`DROP INDEX "public"."idx_workouts_template"`);
        await queryRunner.query(`DROP INDEX "public"."uq_exercises_system_name"`);
        await queryRunner.query(`DROP INDEX "public"."uq_exercises_user_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_exercises_muscle_group"`);
        await queryRunner.query(`DROP INDEX "public"."idx_exercises_user_updated"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "workout_exercises" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "template_id"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "guide_image"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "aliases"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "secondary_muscles"`);
        await queryRunner.query(`DROP TYPE "public"."exercises_secondary_muscles_enum"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11bb1fca0f39e46f0da1b8416f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_feb8abdf639b759cc13be0eca9"`);
        await queryRunner.query(`DROP TABLE "exercise_substitutes"`);
        await queryRunner.query(`DROP INDEX "public"."idx_templates_user_position"`);
        await queryRunner.query(`DROP INDEX "public"."idx_templates_user_updated"`);
        await queryRunner.query(`DROP TABLE "workout_templates"`);
        await queryRunner.query(`DROP TYPE "public"."workout_templates_location_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_template_exercises_template_position"`);
        await queryRunner.query(`DROP INDEX "public"."idx_template_exercises_exercise"`);
        await queryRunner.query(`DROP INDEX "public"."idx_template_exercises_user_updated"`);
        await queryRunner.query(`DROP TABLE "template_exercises"`);
    }

}
