-- Verificar que el usuario existe en auth.users
-- EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Verificar usuario en auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE id = 'e93ddb24-82ca-46fc-b8fa-b24f184c0558';

-- 2. Verificar si existe perfil
SELECT id, email, full_name, created_at
FROM profiles 
WHERE id = 'e93ddb24-82ca-46fc-b8fa-b24f184c0558';

-- 3. Test de inserción directa en memories
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
  'e93ddb24-82ca-46fc-b8fa-b24f184c0558',
  'Test Direct Insert',
  'note',
  'Prueba de inserción directa',
  now(),
  now()
) RETURNING id, title, user_id;

-- 4. Verificar si se insertó
SELECT id, title, user_id, created_at 
FROM memories 
WHERE title = 'Test Direct Insert';

-- 5. Limpiar
DELETE FROM memories WHERE title = 'Test Direct Insert';