-- Full upgrade and legacy attendance migration live in schema.sql.
CREATE TABLE IF NOT EXISTS agenda (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(160) NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  tanggal DATE NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  attendance_version INTEGER NOT NULL DEFAULT 2
);
