// Script para verificar memoria usando service role key
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

// Usar service role key
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMemoryWithServiceRole() {
  const memoryId = 'cdedaf71-2db9-4a2e-824e-82b4ba95bc81';
  console.log(`🔐 Verificando memoria con Service Role Key: ${memoryId}`);
  console.log('📹 Video esperado: "Locally Host n8n AI Agents for FREE"\n');
  
  try {
    // Primero verificar si existe la memoria
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (error) {
      console.error('❌ Error al buscar memoria específica:', error);
      
      // Si no existe, buscar memorias recientes
      console.log('\n📋 Buscando las últimas 10 memorias con Service Role:');
      const { data: recentMemories, error: recentError } = await supabase
        .from('memories')
        .select('id, title, type, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (recentMemories && recentMemories.length > 0) {
        console.log(`\n✅ Encontradas ${recentMemories.length} memorias:\n`);
        recentMemories.forEach((mem, i) => {
          console.log(`${i + 1}. ${mem.title}`);
          console.log(`   ID: ${mem.id}`);
          console.log(`   Tipo: ${mem.type}`);
          console.log(`   Creado: ${new Date(mem.created_at).toLocaleString()}`);
          console.log(`   Tiene transcript: ${mem.metadata?.transcript ? '✅' : '❌'}`);
          console.log(`   Tiene segments: ${mem.metadata?.segments ? '✅ (' + mem.metadata.segments.length + ' segments)' : '❌'}\n`);
        });
      } else {
        console.log('❌ No se encontraron memorias en la base de datos');
      }
      
      // Contar total de memorias
      const { count } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true });
      
      console.log(`\n📊 Total de memorias en la base de datos: ${count || 0}`);
      
      return;
    }

    if (data) {
      console.log('✅ Memoria encontrada:');
      console.log(`   Título: ${data.title}`);
      console.log(`   Tipo: ${data.type}`);
      console.log(`   URL: ${data.url}`);
      console.log(`   Usuario: ${data.user_id}`);
      console.log(`   Creado: ${new Date(data.created_at).toLocaleString()}`);
      console.log(`   Actualizado: ${new Date(data.updated_at).toLocaleString()}`);
      
      console.log('\n📊 Análisis de Metadata:');
      if (data.metadata) {
        console.log(`   Campos presentes: ${Object.keys(data.metadata).join(', ')}`);
        
        // Verificar transcript
        console.log('\n📝 Transcript:');
        if (data.metadata.transcript) {
          console.log(`   ✅ Transcript presente`);
          console.log(`   Longitud: ${data.metadata.transcript.length} caracteres`);
          console.log(`   Primeros 300 caracteres: "${data.metadata.transcript.substring(0, 300)}..."`);
        } else {
          console.log('   ❌ No hay transcript');
        }
        
        // Verificar segments
        console.log('\n🎯 Segments:');
        if (data.metadata.segments) {
          console.log(`   ✅ Segments presentes`);
          console.log(`   Cantidad de segments: ${data.metadata.segments.length}`);
          if (data.metadata.segments.length > 0) {
            console.log('\n   Primeros 5 segments:');
            data.metadata.segments.slice(0, 5).forEach((segment, i) => {
              console.log(`   ${i + 1}. [${segment.start}s - ${segment.end}s] "${segment.text}"`);
            });
          }
        } else {
          console.log('   ❌ No hay segments');
        }
        
        // Mostrar toda la estructura de metadata
        console.log('\n📋 Estructura completa de metadata:');
        console.log(JSON.stringify(data.metadata, null, 2));
      } else {
        console.log('   ❌ No hay metadata');
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkMemoryWithServiceRole();