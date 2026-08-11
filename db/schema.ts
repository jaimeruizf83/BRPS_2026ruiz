import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
    username: text("username"),
    email: text("email").notNull(),
    role: text("role", {
      enum: ["super_admin", "psychologist", "company_admin", "viewer"],
    }).notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    passwordHash: text("password_hash"),
    passwordVersion: integer("password_version").notNull().default(0),
    mustChangePassword: integer("must_change_password", { mode: "boolean" })
      .notNull()
      .default(false),
    temporaryPasswordVersion: text("temporary_password_version"),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: text("locked_until"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastLoginAt: text("last_login_at"),
  },
  (table) => [
    uniqueIndex("app_users_username_uq").on(table.username),
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

// The legacy `campaigns` table is retained to preserve existing deployments.
// Product routes expose these records as battery applications and keep the
// V3-specific configuration in this one-to-one profile.
export const applicationProfiles = sqliteTable("application_profiles", {
  campaignId: text("campaign_id")
    .primaryKey()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  internalCode: text("internal_code").notNull(),
  cutoffDate: text("cutoff_date").notNull(),
  technicalResponsible: text("technical_responsible").notNull(),
  batteryVersion: text("battery_version").notNull().default("V3"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

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

export const manualEvaluations = sqliteTable(
  "manual_evaluations",
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
    evaluatorEmail: text("evaluator_email").notNull(),
    status: text("status", { enum: ["draft", "completed"] })
      .notNull()
      .default("draft"),
    sociodemographicJson: text("sociodemographic_json").notNull().default("{}"),
    intralaboralAnswersJson: text("intralaboral_answers_json").notNull().default("{}"),
    extralaboralAnswersJson: text("extralaboral_answers_json").notNull().default("{}"),
    stressAnswersJson: text("stress_answers_json").notNull().default("{}"),
    servesCustomers: integer("serves_customers", { mode: "boolean" }),
    supervisesPeople: integer("supervises_people", { mode: "boolean" }).notNull(),
    consentVerified: integer("consent_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    resultsJson: text("results_json").notNull().default("{}"),
    scoringVersion: text("scoring_version"),
    scoredAt: text("scored_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"),
  },
  (table) => [
    uniqueIndex("manual_evaluations_application_code_uq").on(
      table.campaignId,
      table.participantCode,
    ),
    index("manual_evaluations_application_idx").on(table.campaignId),
    index("manual_evaluations_updated_idx").on(table.updatedAt),
  ],
);

export const scoringBatches = sqliteTable(
  "scoring_batches",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    requestedForm: text("requested_form", { enum: ["auto", "A", "B"] })
      .notNull()
      .default("auto"),
    status: text("status", { enum: ["open", "completed"] })
      .notNull()
      .default("open"),
    deleteOriginalsAfterConfirmation: integer(
      "delete_originals_after_confirmation",
      { mode: "boolean" },
    )
      .notNull()
      .default(true),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"),
  },
  (table) => [
    index("scoring_batches_campaign_idx").on(table.campaignId),
    index("scoring_batches_created_idx").on(table.createdAt),
  ],
);

export const batchDocuments = sqliteTable(
  "batch_documents",
  {
    id: text("id").primaryKey(),
    batchId: text("batch_id")
      .notNull()
      .references(() => scoringBatches.id, { onDelete: "cascade" }),
    originalName: text("original_name").notNull(),
    sourceType: text("source_type", { enum: ["upload", "drive"] }).notNull(),
    sourceReference: text("source_reference"),
    r2Key: text("r2_key"),
    byteSize: integer("byte_size").notNull(),
    fileSha256: text("file_sha256").notNull(),
    mimeType: text("mime_type").notNull().default("application/pdf"),
    status: text("status", {
      enum: [
        "uploaded",
        "processing",
        "review",
        "reviewed",
        "tabulated",
        "scored",
        "failed",
      ],
    })
      .notNull()
      .default("uploaded"),
    detectedForm: text("detected_form", { enum: ["A", "B", "unknown"] }),
    participantCode: text("participant_code"),
    roleLevel: text("role_level", {
      enum: ["leadership", "professional_technical", "assistant", "operator"],
    }),
    documentConfidence: real("document_confidence"),
    warningsJson: text("warnings_json").notNull().default("[]"),
    extractionModel: text("extraction_model"),
    errorMessage: text("error_message"),
    importedSubmissionId: text("imported_submission_id").references(
      () => submissions.id,
      { onDelete: "set null" },
    ),
    reviewedBy: text("reviewed_by"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    processedAt: text("processed_at"),
    reviewedAt: text("reviewed_at"),
    confirmedAt: text("confirmed_at"),
    originalDeletedAt: text("original_deleted_at"),
  },
  (table) => [
    index("batch_documents_batch_idx").on(table.batchId),
    uniqueIndex("batch_documents_batch_sha_uq").on(
      table.batchId,
      table.fileSha256,
    ),
  ],
);

export const batchAnswers = sqliteTable(
  "batch_answers",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => batchDocuments.id, { onDelete: "cascade" }),
    itemNumber: integer("item_number").notNull(),
    selectedValue: integer("selected_value"),
    reviewedValue: integer("reviewed_value"),
    confidence: real("confidence").notNull().default(0),
    multipleMarks: integer("multiple_marks", { mode: "boolean" })
      .notNull()
      .default(false),
    notes: text("notes").notNull().default(""),
  },
  (table) => [
    uniqueIndex("batch_answers_document_item_uq").on(
      table.documentId,
      table.itemNumber,
    ),
    index("batch_answers_document_idx").on(table.documentId),
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
