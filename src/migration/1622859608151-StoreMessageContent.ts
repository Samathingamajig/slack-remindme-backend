import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreMessageContent1622859608151 implements MigrationInterface {
    name = 'StoreMessageContent1622859608151';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder" ADD "messageContent" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder" DROP COLUMN "messageContent"`);
    }
}
