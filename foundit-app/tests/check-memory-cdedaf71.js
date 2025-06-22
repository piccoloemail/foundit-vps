// Script para verificar la memoria específica con ID cdedaf71-2db9-4a2e-824e-82b4ba95bc81
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

async function checkSpecificMemory() {
  const memoryId = 'cdedaf71-2db9-4a2e-824e-82b4ba95bc81';
  
  console.log(`🔍 Buscando memoria con ID: ${memoryId}`);
  console.log('📹 Video: "Locally Host n8n AI Agents for FREE"\n');
  
  try {
    // Buscar la memoria específica
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (error) {
      console.error('❌ Error al buscar la memoria:', error);
      return;
    }

    if (data) {
      console.log('✅ Memoria encontrada:');
      console.log(`   Título: ${data.title}`);
      console.log(`   Usuario: ${data.user_id}`);
      console.log(`   Tipo: ${data.type}`);
      console.log(`   URL: ${data.url}`);
      console.log(`   Creado: ${new Date(data.created_at).toLocaleString()}`);
      console.log(`   Actualizado: ${data.updated_at ? new Date(data.updated_at).toLocaleString() : 'N/A'}`);
      
      console.log('\n📊 Análisis de Metadata:');
      if (data.metadata) {
        console.log(`   Tipo de metadata: ${typeof data.metadata}`);
        console.log(`   Campos en metadata: ${Object.keys(data.metadata).join(', ')}`);
        
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
        
        // Verificar otros campos importantes
        console.log('\n🔧 Otros campos en metadata:');
        Object.keys(data.metadata).forEach(key => {
          if (key !== 'transcript' && key !== 'segments') {
            const value = data.metadata[key];
            if (typeof value === 'object') {
              console.log(`   ${key}: ${JSON.stringify(value, null, 2)}`);
            } else {
              console.log(`   ${key}: ${value}`);
            }
          }
        });
        
        // Mostrar metadata completa en formato JSON
        console.log('\n📋 Metadata completa (JSON):');
        console.log(JSON.stringify(data.metadata, null, 2));
      } else {
        console.log('   ❌ No hay metadata');
      }
    } else {
      console.log('❌ No se encontró la memoria con ese ID');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkSpecificMemory();