import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkouts1791344569046 implements MigrationInterface {
    name = 'AddWorkouts1791344569046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workouts_location_enum" AS ENUM('gym', 'home', 'outdoor')`);
        await queryRunner.query(`CREATE TABLE "workouts" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "name" character varying(120), "date" date NOT NULL, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "location" "public"."workouts_location_enum" NOT NULL, CONSTRAINT "PK_5b2319bf64a674d40237dbb1697" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "workouts" ADD CONSTRAINT "FK_2df679279a7ac263bcff20c78dd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workouts" DROP CONSTRAINT "FK_2df679279a7ac263bcff20c78dd"`);
        await queryRunner.query(`DROP TABLE "workouts"`);
        await queryRunner.query(`DROP TYPE "public"."workouts_location_enum"`);
    }

}
