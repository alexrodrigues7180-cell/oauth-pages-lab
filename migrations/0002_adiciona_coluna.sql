-- Registra o ultimo uso de cada sessao (epoch em segundos).
ALTER TABLE sessions ADD COLUMN last_seen_at INTEGER;
