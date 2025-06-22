// Script para verificar si una memoria específica existe
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

async function checkMemoryById(memoryId) {
  console.log(`🔍 Buscando memoria con ID: ${memoryId}\n`);
  
  try {
    // Intentar buscar la memoria
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (error) {
      console.error('❌ Error al buscar la memoria:', error);
      
      // Si no se encuentra, buscar las últimas memorias
      console.log('\n📋 Últimas 5 memorias en la base de datos:');
      const { data: recent, error: recentError } = await supabase
        .from('memories')
        .select('id, title, created_at, type, metadata')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (recent) {
        recent.forEach((mem, i) => {
          console.log(`\n${i+1}. ${mem.title}`);
          console.log(`   ID: ${mem.id}`);
          console.log(`   Tipo: ${mem.type}`);
          console.log(`   Creado: ${new Date(mem.created_at).toLocaleString()}`);
          if (mem.metadata?.youtube?.transcript) {
            console.log(`   ✅ Tiene transcript`);
          }
        });
      }
      return;
    }

    if (data) {
      console.log('✅ Memoria encontrada:');
      console.log(`   Título: ${data.title}`);
      console.log(`   Tipo: ${data.type}`);
      console.log(`   URL: ${data.url}`);
      console.log(`   Creado: ${new Date(data.created_at).toLocaleString()}`);
      
      if (data.metadata?.youtube) {
        console.log('\n📺 Metadata de YouTube:');
        console.log(`   Video ID: ${data.metadata.youtube.videoId}`);
        console.log(`   Transcript: ${data.metadata.youtube.transcript ? '✅ Sí' : '❌ No'}`);
        console.log(`   Transcript Source: ${data.metadata.youtube.transcriptSource || 'N/A'}`);
        console.log(`   AI Summary: ${data.metadata.youtube.aiSummary ? '✅ Sí' : '❌ No'}`);
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// ID de la memoria que queremos verificar
const memoryId = process.argv[2] || 'ee5a5368-e1fe-4541-b1e1-5e654f4b9aa8';
checkMemoryById(memoryId);