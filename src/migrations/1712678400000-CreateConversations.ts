import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversations1712678400000 implements MigrationInterface {
  name = 'CreateConversations1712678400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."conversations_role_enum" AS ENUM('user', 'bot')
    `);

    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id"              uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" character varying NOT NULL,
        "user_id"         character varying NOT NULL,
        "message"         text              NOT NULL,
        "role"            "public"."conversations_role_enum" NOT NULL,
        "created_at"      TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_conversation_id"
      ON "conversations" ("conversation_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_conversations_conversation_id"`,
    );
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(
      `DROP TYPE "public"."conversations_role_enum"`,
    );
  }
}
