// Script para hacer backup de tu base de datos de Supabase
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

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log(`
🔒 CÓMO HACER BACKUP DE SUPABASE DE FORMA SEGURA
================================================

OPCIÓN 1: BACKUP COMPLETO DESDE SUPABASE DASHBOARD (RECOMENDADO)
----------------------------------------------------------------
1. Ve a: https://supabase.com/dashboard/project/ffhspmgznqjtqhqbvznl
2. Ve a "Settings" → "Database"
3. Busca la sección "Database Backups"
4. Click en "Download backup" para obtener un backup completo

OPCIÓN 2: BACKUP DE DATOS CON ESTE SCRIPT
------------------------------------------
`);

async function backupMemories() {
  console.log('📦 Iniciando backup de memorias...\n');
  
  try {
    // Obtener TODAS las memorias (sin filtro de usuario para backup completo)
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo memorias:', error);
      return;
    }

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `memories-backup-${timestamp}.json`);

    // Guardar backup
    fs.writeFileSync(backupFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalRecords: memories?.length || 0,
      memories: memories || []
    }, null, 2));

    console.log(`✅ Backup guardado en: ${backupFile}`);
    console.log(`📊 Total de memorias respaldadas: ${memories?.length || 0}`);

    // Mostrar vista previa
    if (memories && memories.length > 0) {
      console.log('\n📋 Vista previa del backup (primeras 3 memorias):');
      memories.slice(0, 3).forEach((mem, i) => {
        console.log(`\n${i + 1}. ${mem.title}`);
        console.log(`   ID: ${mem.id}`);
        console.log(`   Usuario: ${mem.user_id}`);
        console.log(`   Tipo: ${mem.type}`);
        console.log(`   Creado: ${new Date(mem.created_at).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('💥 Error creando backup:', error);
  }
}

console.log(`
OPCIÓN 3: SCRIPT SQL PARA VER POLÍTICAS ACTUALES (SIN CAMBIOS)
--------------------------------------------------------------
Ejecuta esto en SQL Editor para VER las políticas actuales sin modificar nada:

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

OPCIÓN 4: SOLUCIÓN TEMPORAL MÁS SEGURA
--------------------------------------
En lugar de deshabilitar RLS completamente, puedes:

1. Agregar SUPABASE_SERVICE_ROLE_KEY a tu .env.local
2. Modificar el API endpoint para usar esa clave
3. Esto permite que el backend bypasee RLS sin afectar la seguridad del frontend

La service role key la encuentras en:
- Supabase Dashboard → Settings → API → service_role key

IMPORTANTE: 
- NO compartas la service_role key
- NO la uses en el frontend
- Solo úsala en endpoints del servidor

¿Quieres hacer el backup ahora? (s/n): `);

// Preguntar al usuario
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('', async (answer) => {
  if (answer.toLowerCase() === 's') {
    await backupMemories();
  } else {
    console.log('\n👍 Backup cancelado. Siempre es buena idea hacer backup antes de cambios importantes.');
  }
  rl.close();
});