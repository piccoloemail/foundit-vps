-- SOLUCIÓN TEMPORAL: Deshabilitar RLS para debugging

-- 1. Deshabilitar RLS en storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 3. Si funciona con RLS deshabilitado, entonces el problema son las políticas
-- En ese caso, volver a habilitar RLS y crear esta política super simple:

/*
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to do anything in memories bucket" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (bucket_id = 'memories')
WITH CHECK (bucket_id = 'memories');
*/