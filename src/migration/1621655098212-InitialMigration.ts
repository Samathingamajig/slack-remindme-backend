import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1621655098212 implements MigrationInterface {
    name = 'InitialMigration1621655098212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reminder" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "creatorId" character varying NOT NULL, "permalink" character varying NOT NULL, "postAt" integer NOT NULL, "scheduledMessageId" character varying NOT NULL, CONSTRAINT "PK_9ec029d17cb8dece186b9221ede" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "reminder"`);
    }

}
