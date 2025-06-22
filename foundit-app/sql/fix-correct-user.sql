-- Script para crear el perfil con el ID correcto de Supabase
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Crear el perfil para el usuario real de Supabase
INSERT INTO users (
  id,
  email,
  full_name,
  created_at,
  updated_at
) VALUES (
  'e93ddb24-82ca-46fc-b8fa-b24f184c0558',
  'robcean@gmail.com',
  'Rob Cean',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Verificar que se creó correctamente
SELECT id, email, full_name FROM users 
WHERE id = 'e93ddb24-82ca-46fc-b8fa-b24f184c0558';

-- 3. Reactivar RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 4. Verificar todas las políticas están activas
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'memories';