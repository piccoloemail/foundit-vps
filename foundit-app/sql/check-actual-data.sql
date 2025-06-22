-- Verificar datos reales en la base de datos (bypassing RLS)
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Deshabilitar RLS temporalmente para ver todos los datos
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;

-- 2. Ver TODAS las memorias que existen (sin filtro de usuario)
SELECT 
  id, 
  user_id, 
  title, 
  type, 
  url,
  created_at
FROM memories 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Contar total de memorias
SELECT COUNT(*) as total_memories FROM memories;

-- 4. Ver memorias del usuario específico
SELECT 
  id, 
  user_id, 
  title, 
  type, 
  url,
  created_at
FROM memories 
WHERE user_id = 'e93ddb24-82ca-46fc-b8fa-b24f184c0558'
ORDER BY created_at DESC;

-- 5. Reactivar RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;