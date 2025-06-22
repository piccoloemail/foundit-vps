-- SCRIPT PARA VER Y HACER BACKUP DE DATOS EN SUPABASE
-- Ejecuta esto en SQL Editor de Supabase

-- 1. Ver cuántas memorias hay en total (sin filtro RLS)
SELECT COUNT(*) as total_memories FROM memories;

-- 2. Ver las primeras 10 memorias (para verificar que hay datos)
SELECT 
    id,
    title,
    type,
    created_at,
    user_id
FROM memories
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver las políticas RLS actuales (sin cambiar nada)
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'memories';

-- 4. OPCIONAL: Si quieres exportar todos los datos a CSV
-- En Supabase SQL Editor, después de ejecutar este query:
-- SELECT * FROM memories;
-- Puedes hacer click en "Download CSV" para guardar todos los datos

-- 5. IMPORTANTE: NO ejecutes esto a menos que estés seguro:
-- ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
-- Es mejor usar la service role key en tu backend