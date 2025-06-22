// Script para probar si agregar service role key resuelve el problema
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
🔑 INSTRUCCIONES PARA AGREGAR SERVICE ROLE KEY
==============================================

1. Ve a tu proyecto de Supabase:
   https://supabase.com/dashboard/project/ffhspmgznqjtqhqbvznl/settings/api

2. En la sección "Project API keys", copia la clave "service_role"
   (NO copies la "anon" key que ya tienes)

3. Agrega esta línea a tu archivo .env.local:
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

4. Guarda el archivo y reinicia el servidor (npm run dev)

Esta solución permite que tu API backend bypasee RLS sin afectar
la seguridad del frontend. Es la opción más segura.

NOTA: La service role key tiene permisos completos, así que:
- NUNCA la uses en código del cliente/frontend
- NUNCA la subas a git
- Solo úsala en API routes del servidor
`);

// Verificar si ya existe la service role key
if (envVars.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n✅ Ya tienes SUPABASE_SERVICE_ROLE_KEY configurada!');
  console.log('   Longitud:', envVars.SUPABASE_SERVICE_ROLE_KEY.length, 'caracteres');
} else {
  console.log('\n❌ No se encontró SUPABASE_SERVICE_ROLE_KEY en .env.local');
}