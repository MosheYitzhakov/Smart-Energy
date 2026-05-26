import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTariffsAndAutomations1748100000000 implements MigrationInterface {
  name = 'AddTariffsAndAutomations1748100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tariff_configs" (
        "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId"      UUID NOT NULL,
        "peakRate"    DECIMAL(8,4) NOT NULL DEFAULT 0.65,
        "offPeakRate" DECIMAL(8,4) NOT NULL DEFAULT 0.48,
        "peakStart"   INTEGER NOT NULL DEFAULT 17,
        "peakEnd"     INTEGER NOT NULL DEFAULT 22,
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tariff_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tariff_configs_user" UNIQUE ("userId"),
        CONSTRAINT "FK_tariff_configs_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "automation_rules" (
        "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId"    UUID NOT NULL,
        "deviceId"  UUID,
        "name"      VARCHAR NOT NULL,
        "condition" JSONB NOT NULL,
        "action"    JSONB NOT NULL,
        "isActive"  BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_automation_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_automation_rules_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_automation_rules_device" FOREIGN KEY ("deviceId")
          REFERENCES "devices"("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "automation_rules"`);
    await queryRunner.query(`DROP TABLE "tariff_configs"`);
  }
}
