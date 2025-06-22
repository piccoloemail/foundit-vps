-- SOLUCIÓN ALTERNATIVA: Políticas más simples

-- 1. Primero, asegurarse de que RLS esté habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 3. Crear una política simple que permita todo a usuarios autenticados en el bucket memories
CREATE POLICY "Give users full access to own folder" 
ON storage.objects FOR ALL 
TO authenticated
USING (bucket_id = 'memories' AND (auth.uid()::text = (storage.foldername(name))[1]))
WITH CHECK (bucket_id = 'memories' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- 4. Verificar que se creó correctamente
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';