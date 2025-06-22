-- Script simple para verificar datos
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;

SELECT COUNT(*) FROM memories;

SELECT id, title, user_id, created_at FROM memories ORDER BY created_at DESC LIMIT 5;

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;