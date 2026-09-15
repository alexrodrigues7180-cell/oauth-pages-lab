-- Cole este arquivo inteiro no Console do banco D1 (Storage & Databases > D1 > seu banco > Console)

CREATE TABLE oauth_transactions (
  id_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github')),
  state_hash TEXT NOT NULL,
  nonce TEXT,
  code_verifier TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX oauth_transactions_expiry
  ON oauth_transactions (expires_at);

CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX sessions_expiry
  ON sessions (expires_at);

-- Depois de criar as tabelas, rode esta consulta e cole o resultado em
-- public/entrega1/04-d1-esquema.txt (item 9.1 do roteiro):
--
-- SELECT name, type
-- FROM sqlite_schema
-- WHERE name NOT LIKE 'sqlite_%'
-- ORDER BY type, name;
