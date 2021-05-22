require('dotenv').config();

module.exports = {
    type: 'postgres',
    host: 'localhost',
    port: Number(process.env['DATABASE_PORT']),
    database: process.env['DATABASE_NAME'],
    username: process.env['DATABASE_USER'],
    password: process.env['DATABASE_PASSWORD'],
    synchronize: false,
    logging: true,
    entities: ['src/entity/**/*.ts'],
    migrations: ['src/migration/**/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
    cli: {
        entitiesDir: 'src/entity',
        migrationsDir: 'src/migration',
        subscribersDir: 'src/subscriber',
    },
};
