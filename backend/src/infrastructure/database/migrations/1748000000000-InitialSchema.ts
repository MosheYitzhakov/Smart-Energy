import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748000000000 implements MigrationInterface {
  name = 'InitialSchema1748000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // users
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('user', 'admin')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
        "email"      VARCHAR NOT NULL,
        "password"   VARCHAR NOT NULL,
        "role"       "users_role_enum" NOT NULL DEFAULT 'user',
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // devices
    await queryRunner.query(`
      CREATE TYPE "devices_type_enum" AS ENUM ('ac', 'boiler', 'solar', 'other')
    `);
    await queryRunner.query(`
      CREATE TABLE "devices" (
        "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId"      UUID NOT NULL,
        "name"        VARCHAR NOT NULL,
        "type"        "devices_type_enum" NOT NULL,
        "powerWatts"  DECIMAL(10,2) NOT NULL,
        "isActive"    BOOLEAN NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_devices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_devices_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // energy_readings
    await queryRunner.query(`
      CREATE TYPE "energy_readings_source_enum" AS ENUM ('simulation', 'real')
    `);
    await queryRunner.query(`
      CREATE TABLE "energy_readings" (
        "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
        "deviceId"  UUID NOT NULL,
        "timestamp" BIGINT NOT NULL,
        "watts"     DECIMAL(10,2) NOT NULL,
        "kwhTotal"  DECIMAL(10,4) NOT NULL,
        "source"    "energy_readings_source_enum" NOT NULL DEFAULT 'simulation',
        CONSTRAINT "PK_energy_readings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_energy_readings_device_ts" UNIQUE ("deviceId", "timestamp"),
        CONSTRAINT "FK_energy_readings_device" FOREIGN KEY ("deviceId")
          REFERENCES "devices"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_energy_readings_device_ts"
        ON "energy_readings" ("deviceId", "timestamp" DESC)
    `);

    // energy_hourly
    await queryRunner.query(`
      CREATE TABLE "energy_hourly" (
        "deviceId"      VARCHAR NOT NULL,
        "hour"          VARCHAR NOT NULL,
        "avgWatts"      DECIMAL(10,2) NOT NULL,
        "maxWatts"      DECIMAL(10,2) NOT NULL,
        "totalKwh"      DECIMAL(10,4) NOT NULL,
        "estimatedCost" DECIMAL(10,4) NOT NULL,
        CONSTRAINT "PK_energy_hourly" PRIMARY KEY ("deviceId", "hour")
      )
    `);

    // energy_daily
    await queryRunner.query(`
      CREATE TABLE "energy_daily" (
        "deviceId"  VARCHAR NOT NULL,
        "date"      VARCHAR NOT NULL,
        "totalKwh"  DECIMAL(10,4) NOT NULL,
        "peakWatts" DECIMAL(10,2) NOT NULL,
        "totalCost" DECIMAL(10,4) NOT NULL,
        CONSTRAINT "PK_energy_daily" PRIMARY KEY ("deviceId", "date")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "energy_daily"`);
    await queryRunner.query(`DROP TABLE "energy_hourly"`);
    await queryRunner.query(`DROP INDEX "IDX_energy_readings_device_ts"`);
    await queryRunner.query(`DROP TABLE "energy_readings"`);
    await queryRunner.query(`DROP TYPE "energy_readings_source_enum"`);
    await queryRunner.query(`DROP TABLE "devices"`);
    await queryRunner.query(`DROP TYPE "devices_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
