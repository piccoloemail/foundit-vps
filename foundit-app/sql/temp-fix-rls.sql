-- SOLUCIÓN TEMPORAL PARA DESARROLLO
-- ⚠️ ADVERTENCIA: Solo usar en desarrollo, NO en producción

-- Opción 1: Deshabilitar RLS temporalmente (más simple pero menos seguro)
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;

-- Opción 2: Crear una política permisiva temporal
-- (Comenta la línea de arriba y descomenta las siguientes si prefieres esta opción)
-- DROP POLICY IF EXISTS "Temporary - Allow all for authenticated users" ON memories;
-- CREATE POLICY "Temporary - Allow all for authenticated users" ON memories
--   FOR ALL USING (auth.role() = 'authenticated');

-- Para verificar el estado de RLS:
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'memories';

-- Para revertir los cambios (volver a habilitar RLS):
-- ALTER TABLE memories ENABLE ROW LEVEL SECURITY;