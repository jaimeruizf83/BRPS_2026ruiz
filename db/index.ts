type Bindings = {
  DB?: D1Database;
  BRPS_ADMIN_EMAILS?: string;
  BRPS_APP_SECRET?: string;
  MIN_GROUP_SIZE?: string;
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
    email TEXT NOT NULL COLLATE NOCASE,
    role TEXT NOT NULL CHECK(role IN ('super_admin','psychologist','company_admin','viewer')),
    active INTEGER NOT NULL DEFAULT 1,
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
      .then(() => undefined)
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
