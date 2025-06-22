-- Prueba temporal: Deshabilitar RLS para testing
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Deshabilitar RLS temporalmente para testing
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que no hay RLS activo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'memories';

-- 3. Hacer una prueba de INSERT manual
INSERT INTO memories (
  id,
  user_id,
  title,
  type,
  content,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2336d067-02ca-46fc-b8fa-b24f184c8536',
  'Test Manual Insert',
  'note',
  'Prueba manual de inserción',
  now(),
  now()
);

-- 4. Verificar si se insertó
SELECT id, title, user_id, created_at 
FROM memories 
WHERE title = 'Test Manual Insert';

-- 5. Limpiar
DELETE FROM memories WHERE title = 'Test Manual Insert';

-- 6. IMPORTANTE: Reactivar RLS después del test
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;