-- Script para crear el perfil de usuario que falta
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Verificar usuarios existentes
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 2. Verificar perfiles existentes en tabla users/profiles
SELECT id, email, created_at FROM users LIMIT 5;

-- 3. Crear el perfil que falta (ajusta el email según corresponda)
INSERT INTO users (
  id,
  email,
  full_name,
  created_at,
  updated_at
) VALUES (
  '2336d067-02ca-46fc-b8fa-b24f184c8536',
  'tu-email@ejemplo.com', -- CAMBIA ESTO por tu email real
  'Usuario',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Verificar que se creó
SELECT id, email, full_name FROM users 
WHERE id = '2336d067-02ca-46fc-b8fa-b24f184c8536';

-- 5. Reactivar RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;