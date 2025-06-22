-- Crear una tabla simple para loggear inserts
CREATE TABLE IF NOT EXISTS insert_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text,
  record_id uuid,
  user_id uuid,
  action text,
  created_at timestamp with time zone DEFAULT now()
);

-- Crear función para loggear inserts
CREATE OR REPLACE FUNCTION log_memory_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO insert_logs (table_name, record_id, user_id, action)
  VALUES ('memories', NEW.id, NEW.user_id, 'INSERT');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS memory_insert_trigger ON memories;
CREATE TRIGGER memory_insert_trigger
  AFTER INSERT ON memories
  FOR EACH ROW
  EXECUTE FUNCTION log_memory_insert();

-- Ver logs recientes
SELECT * FROM insert_logs ORDER BY created_at DESC LIMIT 10;