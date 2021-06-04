import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthorIdAndPostAtIndex1622833957249 implements MigrationInterface {
    name = 'AuthorIdAndPostAtIndex1622833957249';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_86805c1e0755acca0958d26170" ON "reminder" ("creatorId", "postAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_86805c1e0755acca0958d26170"`);
    }
}
