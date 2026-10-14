-- Indice para a consulta de /api/sessoes, que filtra por email e expires_at.
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email, expires_at);
