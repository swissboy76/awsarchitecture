PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  company TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  overall_score INTEGER NOT NULL,
  security_score INTEGER NOT NULL,
  reliability_score INTEGER NOT NULL,
  cost_score INTEGER NOT NULL,
  operations_score INTEGER NOT NULL,
  performance_score INTEGER NOT NULL,
  sustainability_score INTEGER NOT NULL,
  top_findings_json TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
