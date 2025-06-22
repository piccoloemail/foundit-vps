-- Script automático para crear perfiles de usuarios que faltan
-- EJECUTAR EN SUPABASE SQL EDITOR

-- Crear perfiles automáticamente para todos los usuarios autenticados que no tienen perfil
INSERT INTO users (id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  au.created_at,
  now()
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Verificar que se crearon los perfiles
SELECT 
  u.id, 
  u.email, 
  u.full_name,
  u.created_at
FROM users u
ORDER BY u.created_at DESC
LIMIT 5;

-- Reactivar RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;