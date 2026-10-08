import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExercises1791344226388 implements MigrationInterface {
    name = 'AddExercises1791344226388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."exercises_muscle_group_enum" AS ENUM('chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'adductors', 'calves', 'core', 'forearms', 'cardio')`);
        await queryRunner.query(`CREATE TYPE "public"."exercises_equipment_enum" AS ENUM('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'pullup-bar', 'bench', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."exercises_category_enum" AS ENUM('compound', 'isolation', 'cardio')`);
        await queryRunner.query(`CREATE TABLE "exercises" ("id" uuid NOT NULL, "name" character varying(120) NOT NULL, "muscle_group" "public"."exercises_muscle_group_enum" NOT NULL, "equipment" "public"."exercises_equipment_enum" NOT NULL, "category" "public"."exercises_category_enum" NOT NULL, CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "exercises"`);
        await queryRunner.query(`DROP TYPE "public"."exercises_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."exercises_equipment_enum"`);
        await queryRunner.query(`DROP TYPE "public"."exercises_muscle_group_enum"`);
    }

}
