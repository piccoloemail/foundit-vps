// Script para verificar y explicar cómo arreglar RLS en Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log(`
🔧 INSTRUCCIONES PARA ARREGLAR RLS EN SUPABASE
==============================================

El problema actual es que las políticas RLS (Row Level Security) no permiten 
que el usuario vea las memorias que acaba de crear.

PASOS PARA ARREGLAR:

1. Ve a tu proyecto de Supabase:
   https://supabase.com/dashboard/project/${envVars.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]?.replace('https://', '')}

2. Ve a SQL Editor y ejecuta este script:

-- ============================================
-- SCRIPT PARA ARREGLAR RLS EN TABLA MEMORIES
-- ============================================

-- Ver las políticas actuales
SELECT 
    policyname, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'memories';

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Enable read access for users" ON memories;
DROP POLICY IF EXISTS "Enable insert for users" ON memories;
DROP POLICY IF EXISTS "Enable update for users" ON memories;
DROP POLICY IF EXISTS "Enable delete for users" ON memories;
DROP POLICY IF EXISTS "Users can view own memories" ON memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
DROP POLICY IF EXISTS "Users can update own memories" ON memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON memories;

-- Crear nuevas políticas correctas
CREATE POLICY "Users can view own memories" ON memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON memories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON memories
    FOR DELETE USING (auth.uid() = user_id);

-- Asegurar que RLS esté habilitado
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Verificar que las políticas se crearon
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'memories';

-- ============================================

3. Para el API endpoint, necesitas crear una variable de entorno adicional:
   SUPABASE_SERVICE_ROLE_KEY

   Esta clave la encuentras en:
   - Supabase Dashboard > Settings > API
   - Copia el "service_role" key (NO el anon key)
   - Agrégala a tu .env.local

4. Después de ejecutar el script SQL, prueba crear una memoria nueva.

ALTERNATIVA TEMPORAL:
Si no puedes cambiar las políticas RLS ahora, puedes deshabilitar RLS temporalmente:

ALTER TABLE memories DISABLE ROW LEVEL SECURITY;

⚠️ ADVERTENCIA: Esto es solo para testing. NO lo hagas en producción.
`);

// Test actual connection
async function testConnection() {
  const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('\n🔍 Probando conexión actual...');
  
  const { data, error } = await supabase
    .from('memories')
    .select('id')
    .limit(1);
    
  if (error) {
    console.log('❌ Error de conexión:', error.message);
  } else {
    console.log('✅ Conexión exitosa');
  }
}

testConnection();