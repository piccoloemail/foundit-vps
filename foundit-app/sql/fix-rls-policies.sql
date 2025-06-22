-- Script para corregir las políticas RLS en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar las políticas actuales
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'memories';

-- 2. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Users can view own memories" ON memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
DROP POLICY IF EXISTS "Users can update own memories" ON memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON memories;

-- 3. Crear políticas RLS correctas
-- Política para SELECT (leer memorias propias)
CREATE POLICY "Users can view own memories" ON memories
  FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT (crear memorias propias)
CREATE POLICY "Users can insert own memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (actualizar memorias propias)
CREATE POLICY "Users can update own memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE (eliminar memorias propias)
CREATE POLICY "Users can delete own memories" ON memories
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Asegurar que RLS esté habilitado
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 5. Verificar que las políticas se crearon correctamente
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'memories';