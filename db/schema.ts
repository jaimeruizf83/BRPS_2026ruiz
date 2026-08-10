import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nit: text("nit").notNull().default(""),
  sector: text("sector").notNull().default(""),
  city: text("city").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const appUsers = sqliteTable(
  "app_users",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role", {
      enum: ["super_admin", "psychologist", "company_admin", "viewer"],
    }).notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastLoginAt: text("last_login_at"),
  },
  (table) => [
    uniqueIndex("app_users_email_uq").on(table.email),
    index("app_users_org_idx").on(table.organizationId),
  ],
);

export const campaigns = sqliteTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", { enum: ["draft", "active", "closed"] })
      .notNull()
      .default("draft"),
    startsOn: text("starts_on"),
    endsOn: text("ends_on"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("campaigns_org_idx").on(table.organizationId)],
);

export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    participantCode: text("participant_code").notNull(),
    roleLevel: text("role_level", {
      enum: ["leadership", "professional_technical", "assistant", "operator"],
    }).notNull(),
    instrumentForm: text("instrument_form", { enum: ["A", "B"] }).notNull(),
    inviteTokenHash: text("invite_token_hash").notNull(),
    status: text("status", { enum: ["invited", "started", "completed"] })
      .notNull()
      .default("invited"),
    consentAt: text("consent_at"),
    consentVersion: text("consent_version"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("participants_token_uq").on(table.inviteTokenHash),
    uniqueIndex("participants_campaign_code_uq").on(
      table.campaignId,
      table.participantCode,
    ),
    index("participants_campaign_idx").on(table.campaignId),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    instrumentId: text("instrument_id").notNull(),
    instrumentVersion: text("instrument_version").notNull(),
    answersJson: text("answers_json").notNull(),
    resultsJson: text("results_json").notNull(),
    ipHash: text("ip_hash").notNull(),
    completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("submissions_participant_uq").on(table.participantId),
    index("submissions_completed_idx").on(table.completedAt),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    detailsJson: text("details_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("audit_logs_created_idx").on(table.createdAt)],
);
