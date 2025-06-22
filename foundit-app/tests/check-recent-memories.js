// Script para verificar memorias recientes y buscar el ID proporcionado
const fs = require('fs');
const path = require('path');

// Leer variables de entorno del archivo .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRecentMemories() {
  const targetId = 'cdedaf71-2db9-4a2e-824e-82b4ba95bc81';
  
  console.log(`🔍 Verificando si existe el ID: ${targetId}\n`);
  
  try {
    // Primero intentar buscar con LIKE para ver si hay IDs similares
    const { data: similarIds, error: similarError } = await supabase
      .from('memories')
      .select('id, title, created_at')
      .like('id', 'cded%')
      .limit(10);

    if (similarIds && similarIds.length > 0) {
      console.log('📋 IDs similares encontrados:');
      similarIds.forEach(mem => {
        console.log(`   ${mem.id} - ${mem.title}`);
      });
      console.log('');
    }

    // Buscar las últimas 20 memorias
    console.log('📋 Últimas 20 memorias en la base de datos:\n');
    const { data: recent, error: recentError } = await supabase
      .from('memories')
      .select('id, title, type, url, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (recent) {
      recent.forEach((mem, i) => {
        console.log(`${i + 1}. ${mem.title}`);
        console.log(`   ID: ${mem.id}`);
        console.log(`   Tipo: ${mem.type}`);
        console.log(`   URL: ${mem.url}`);
        console.log(`   Creado: ${new Date(mem.created_at).toLocaleString()}`);
        console.log(`   Tiene transcript: ${mem.metadata?.transcript ? '✅' : '❌'}`);
        console.log(`   Tiene segments: ${mem.metadata?.segments ? '✅ (' + mem.metadata.segments.length + ' segments)' : '❌'}`);
        
        // Verificar si alguno coincide con el ID buscado
        if (mem.id === targetId) {
          console.log('   ⭐ ¡ESTE ES EL QUE BUSCAMOS!');
        }
        console.log('');
      });
      
      // Verificar si el ID existe en algún lugar
      const foundMemory = recent.find(mem => mem.id === targetId);
      if (!foundMemory) {
        console.log(`\n❌ El ID ${targetId} NO se encuentra entre las últimas 20 memorias`);
      }
    }

    // Buscar por conteo total
    const { count, error: countError } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true });
      
    console.log(`\n📊 Total de memorias en la base de datos: ${count}`);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkRecentMemories();