import {MigrationInterface, QueryRunner} from "typeorm";

export class MoreMessageInfo1622263077249 implements MigrationInterface {
    name = 'MoreMessageInfo1622263077249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder" ADD "authorId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD "authorName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD "channelId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD "channelName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reminder" ADD "messageTs" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "messageTs"`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "channelName"`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "channelId"`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "authorName"`);
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "authorId"`);
    }

}
