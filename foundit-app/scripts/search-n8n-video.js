// Script para buscar el video "Locally Host n8n AI Agents for FREE"
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

async function searchN8nVideo() {
  console.log('🔍 Buscando video "Locally Host n8n AI Agents for FREE"\n');
  
  try {
    // Buscar por título exacto
    const { data: exactMatch, error: exactError } = await supabase
      .from('memories')
      .select('*')
      .eq('title', 'Locally Host n8n AI Agents for FREE')
      .single();

    if (exactMatch) {
      console.log('✅ Encontrado con título exacto:');
      displayMemory(exactMatch);
    } else {
      console.log('❌ No encontrado con título exacto\n');
      
      // Buscar con LIKE
      console.log('🔍 Buscando con términos parciales...\n');
      
      const { data: partialMatches, error: partialError } = await supabase
        .from('memories')
        .select('*')
        .or('title.ilike.%n8n%,title.ilike.%locally%,title.ilike.%host%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (partialMatches && partialMatches.length > 0) {
        console.log(`📋 Encontrados ${partialMatches.length} videos relacionados:\n`);
        partialMatches.forEach((mem, i) => {
          console.log(`${i + 1}. ${mem.title}`);
          console.log(`   ID: ${mem.id}`);
          console.log(`   URL: ${mem.url}`);
          console.log(`   Creado: ${new Date(mem.created_at).toLocaleString()}`);
          console.log(`   Tiene transcript: ${mem.metadata?.transcript ? '✅' : '❌'}`);
          console.log(`   Tiene segments: ${mem.metadata?.segments ? '✅ (' + mem.metadata.segments.length + ' segments)' : '❌'}\n`);
        });
      } else {
        console.log('❌ No se encontraron videos relacionados');
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

function displayMemory(data) {
  console.log(`   ID: ${data.id}`);
  console.log(`   Título: ${data.title}`);
  console.log(`   Usuario: ${data.user_id}`);
  console.log(`   Tipo: ${data.type}`);
  console.log(`   URL: ${data.url}`);
  console.log(`   Creado: ${new Date(data.created_at).toLocaleString()}`);
  
  console.log('\n📊 Análisis de Metadata:');
  if (data.metadata) {
    // Verificar transcript
    console.log('\n📝 Transcript:');
    if (data.metadata.transcript) {
      console.log(`   ✅ Transcript presente`);
      console.log(`   Longitud: ${data.metadata.transcript.length} caracteres`);
      console.log(`   Primeros 200 caracteres: "${data.metadata.transcript.substring(0, 200)}..."`);
    } else {
      console.log('   ❌ No hay transcript');
    }
    
    // Verificar segments
    console.log('\n🎯 Segments:');
    if (data.metadata.segments) {
      console.log(`   ✅ Segments presentes`);
      console.log(`   Cantidad de segments: ${data.metadata.segments.length}`);
      if (data.metadata.segments.length > 0) {
        console.log('\n   Primeros 3 segments:');
        data.metadata.segments.slice(0, 3).forEach((segment, i) => {
          console.log(`   ${i + 1}. Start: ${segment.start}s, End: ${segment.end}s`);
          console.log(`      Text: "${segment.text}"`);
        });
      }
    } else {
      console.log('   ❌ No hay segments');
    }
  } else {
    console.log('   ❌ No hay metadata');
  }
}

searchN8nVideo();