type Bindings = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  BRPS_ADMIN_EMAILS?: string;
  BRPS_APP_SECRET?: string;
  MIN_GROUP_SIZE?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BATCH_MODEL?: string;
};

declare global {
  var __BRPS_ENV__: Bindings | undefined;
}

export function getBindings(): Bindings {
  return globalThis.__BRPS_ENV__ ?? {};
}

export function getD1(): D1Database {
  const database = getBindings().DB;
  if (!database) {
    throw new Error(
      "La base de datos D1 no está disponible. Verifica el binding DB de Sites.",
    );
  }
  return database;
}

export function getBucket(): R2Bucket {
  const bucket = getBindings().BUCKET;
  if (!bucket) {
    throw new Error(
      "El almacenamiento privado R2 no está disponible. Verifica el binding BUCKET de Sites.",
    );
  }
  return bucket;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nit TEXT NOT NULL DEFAULT '',
    sector TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    username TEXT COLLATE NOCASE,
    email TEXT NOT NULL COLLATE NOCASE,
    role TEXT NOT NULL CHECK(role IN ('super_admin','psychologist','company_admin','viewer')),
    active INTEGER NOT NULL DEFAULT 1,
    password_hash TEXT,
    password_version INTEGER NOT NULL DEFAULT 0,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_uq ON app_users(email)`,
  `CREATE INDEX IF NOT EXISTS app_users_org_idx ON app_users(organization_id)`,
  `CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','closed')),
    starts_on TEXT,
    ends_on TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS campaigns_org_idx ON campaigns(organization_id)`,
  `CREATE TABLE IF NOT EXISTS application_profiles (
    campaign_id TEXT PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
    internal_code TEXT NOT NULL,
    cutoff_date TEXT NOT NULL,
    technical_responsible TEXT NOT NULL,
    battery_version TEXT NOT NULL DEFAULT 'V3',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    participant_code TEXT NOT NULL,
    role_level TEXT NOT NULL CHECK(role_level IN ('leadership','professional_technical','assistant','operator')),
    instrument_form TEXT NOT NULL CHECK(instrument_form IN ('A','B')),
    invite_token_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'invited' CHECK(status IN ('invited','started','completed')),
    consent_at TEXT,
    consent_version TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS participants_token_uq ON participants(invite_token_hash)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS participants_campaign_code_uq ON participants(campaign_id, participant_code)`,
  `CREATE INDEX IF NOT EXISTS participants_campaign_idx ON participants(campaign_id)`,
  `CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL UNIQUE REFERENCES participants(id) ON DELETE CASCADE,
    instrument_id TEXT NOT NULL,
    instrument_version TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    results_json TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS submissions_completed_idx ON submissions(completed_at)`,
  `CREATE TABLE IF NOT EXISTS manual_evaluations (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    participant_code TEXT NOT NULL,
    role_level TEXT NOT NULL CHECK(role_level IN ('leadership','professional_technical','assistant','operator')),
    instrument_form TEXT NOT NULL CHECK(instrument_form IN ('A','B')),
    evaluator_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','completed')),
    sociodemographic_json TEXT NOT NULL DEFAULT '{}',
    intralaboral_answers_json TEXT NOT NULL DEFAULT '{}',
    extralaboral_answers_json TEXT NOT NULL DEFAULT '{}',
    stress_answers_json TEXT NOT NULL DEFAULT '{}',
    serves_customers INTEGER,
    supervises_people INTEGER NOT NULL DEFAULT 0,
    consent_verified INTEGER NOT NULL DEFAULT 0,
    results_json TEXT NOT NULL DEFAULT '{}',
    scoring_version TEXT,
    scored_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS manual_evaluations_application_code_uq ON manual_evaluations(campaign_id,participant_code)`,
  `CREATE INDEX IF NOT EXISTS manual_evaluations_application_idx ON manual_evaluations(campaign_id)`,
  `CREATE INDEX IF NOT EXISTS manual_evaluations_updated_idx ON manual_evaluations(updated_at)`,
  `CREATE TABLE IF NOT EXISTS scoring_batches (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    requested_form TEXT NOT NULL DEFAULT 'auto' CHECK(requested_form IN ('auto','A','B')),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','completed')),
    delete_originals_after_confirmation INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS scoring_batches_campaign_idx ON scoring_batches(campaign_id)`,
  `CREATE INDEX IF NOT EXISTS scoring_batches_created_idx ON scoring_batches(created_at)`,
  `CREATE TABLE IF NOT EXISTS batch_documents (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES scoring_batches(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('upload','drive')),
    source_reference TEXT,
    r2_key TEXT,
    byte_size INTEGER NOT NULL,
    file_sha256 TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK(status IN ('uploaded','processing','review','reviewed','tabulated','scored','failed')),
    detected_form TEXT CHECK(detected_form IN ('A','B','unknown')),
    participant_code TEXT,
    role_level TEXT CHECK(role_level IN ('leadership','professional_technical','assistant','operator')),
    document_confidence REAL,
    warnings_json TEXT NOT NULL DEFAULT '[]',
    extraction_model TEXT,
    error_message TEXT,
    imported_submission_id TEXT REFERENCES submissions(id) ON DELETE SET NULL,
    reviewed_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT,
    reviewed_at TEXT,
    confirmed_at TEXT,
    original_deleted_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS batch_documents_batch_idx ON batch_documents(batch_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS batch_documents_batch_sha_uq ON batch_documents(batch_id,file_sha256)`,
  `CREATE TABLE IF NOT EXISTS batch_answers (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES batch_documents(id) ON DELETE CASCADE,
    item_number INTEGER NOT NULL,
    selected_value INTEGER,
    reviewed_value INTEGER,
    confidence REAL NOT NULL DEFAULT 0,
    multiple_marks INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS batch_answers_document_item_uq ON batch_answers(document_id,item_number)`,
  `CREATE INDEX IF NOT EXISTS batch_answers_document_idx ON batch_answers(document_id)`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at)`,
];

let schemaReady: Promise<void> | null = null;

export async function ensureSchema() {
  if (!schemaReady) {
    const db = getD1();
    schemaReady = db
      .batch(schemaStatements.map((statement) => db.prepare(statement)))
      .then(async () => {
        const requiredColumns = [
          ["app_users", "username", "TEXT"],
          ["app_users", "password_hash", "TEXT"],
          ["app_users", "password_version", "INTEGER NOT NULL DEFAULT 0"],
          ["app_users", "failed_login_count", "INTEGER NOT NULL DEFAULT 0"],
          ["app_users", "locked_until", "TEXT"],
          ["manual_evaluations", "results_json", "TEXT NOT NULL DEFAULT '{}'"],
          ["manual_evaluations", "scoring_version", "TEXT"],
          ["manual_evaluations", "scored_at", "TEXT"],
        ] as const;
        const tableColumns = new Map<string, Set<string>>();
        for (const [table] of requiredColumns) {
          if (tableColumns.has(table)) continue;
          const info = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
          tableColumns.set(table, new Set(info.results.map((column) => column.name)));
        }
        for (const [table, column, definition] of requiredColumns) {
          if (!tableColumns.get(table)?.has(column)) {
            await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
          }
        }
        await db
          .prepare("UPDATE app_users SET username=lower(email) WHERE username IS NULL OR trim(username)=''")
          .run();
        await db
          .prepare("CREATE UNIQUE INDEX IF NOT EXISTS app_users_username_uq ON app_users(username COLLATE NOCASE)")
          .run();
      })
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}

export async function one<T>(sql: string, ...values: unknown[]) {
  await ensureSchema();
  return getD1().prepare(sql).bind(...values).first<T>();
}

export async function all<T>(sql: string, ...values: unknown[]) {
  await ensureSchema();
  const result = await getD1().prepare(sql).bind(...values).all<T>();
  return result.results;
}

export async function run(sql: string, ...values: unknown[]) {
  await ensureSchema();
  return getD1().prepare(sql).bind(...values).run();
}

export async function audit(
  actorEmail: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  return run(
    `INSERT INTO audit_logs
      (actor_email, action, entity_type, entity_id, details_json)
     VALUES (?, ?, ?, ?, ?)`,
    actorEmail,
    action,
    entityType,
    entityId,
    JSON.stringify(details),
  );
}
