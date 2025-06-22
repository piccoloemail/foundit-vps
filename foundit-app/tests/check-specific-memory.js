// Script para verificar una memoria específica
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificMemory() {
  const videoUrl = 'https://www.youtube.com/watch?v=IXJEGjfZRBE';
  const videoId = 'IXJEGjfZRBE';
  
  console.log(`🔍 Buscando memoria con URL: ${videoUrl}`);
  console.log(`🔍 O con video ID: ${videoId}\n`);
  
  try {
    // Buscar por URL completa
    const { data: urlData, error: urlError } = await supabase
      .from('memories')
      .select('*')
      .eq('url', videoUrl);

    // Buscar por URL que contenga el video ID
    const { data: idData, error: idError } = await supabase
      .from('memories')
      .select('*')
      .ilike('url', `%${videoId}%`);

    // También buscar en metadata
    const { data: metadataData, error: metaError } = await supabase
      .from('memories')
      .select('*')
      .ilike('metadata', `%${videoId}%`);

    let foundMemories = [];
    
    if (urlData && urlData.length > 0) {
      foundMemories = foundMemories.concat(urlData);
    }
    
    if (idData && idData.length > 0) {
      // Evitar duplicados
      idData.forEach(memory => {
        if (!foundMemories.find(m => m.id === memory.id)) {
          foundMemories.push(memory);
        }
      });
    }
    
    if (metadataData && metadataData.length > 0) {
      // Evitar duplicados
      metadataData.forEach(memory => {
        if (!foundMemories.find(m => m.id === memory.id)) {
          foundMemories.push(memory);
        }
      });
    }

    if (foundMemories.length > 0) {
      console.log(`✅ Encontradas ${foundMemories.length} memoria(s):\n`);
      
      for (let i = 0; i < foundMemories.length; i++) {
        const data = foundMemories[i];
        console.log(`--- Memoria ${i + 1} ---`);
        console.log(`   ID: ${data.id}`);
        console.log(`   Título: ${data.title}`);
        console.log(`   Usuario: ${data.user_id}`);
        console.log(`   Tipo: ${data.type}`);
        console.log(`   URL: ${data.url}`);
        console.log(`   Creado: ${new Date(data.created_at).toLocaleString()}`);
        console.log(`   Actualizado: ${new Date(data.updated_at).toLocaleString()}`);
        
        // Verificar si tiene transcript
        if (data.transcript) {
          console.log(`   📝 Transcript: SÍ (${data.transcript.length} caracteres)`);
        } else {
          console.log(`   📝 Transcript: NO`);
        }
        
        // Verificar metadata
        if (data.metadata) {
          console.log(`   📊 Metadata: ${JSON.stringify(data.metadata, null, 4)}`);
        } else {
          console.log(`   📊 Metadata: NO`);
        }
        
        // Buscar segments relacionados
        const { data: segments, error: segError } = await supabase
          .from('segments')
          .select('*')
          .eq('memory_id', data.id);
          
        if (segments && segments.length > 0) {
          console.log(`   🔗 Segments: ${segments.length} encontrados`);
          segments.forEach((seg, idx) => {
            console.log(`      Segment ${idx + 1}: ${seg.content?.substring(0, 100)}...`);
          });
        } else {
          console.log(`   🔗 Segments: NO`);
        }
        
        console.log('\n');
      }
    } else {
      console.log('❌ No se encontró ninguna memoria con esa URL o video ID');
      
      // Si no se encuentra, buscar las últimas 5 memorias
      console.log('\n📋 Últimas 5 memorias en la base de datos:');
      const { data: recent, error: recentError } = await supabase
        .from('memories')
        .select('id, title, created_at, user_id, url')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (recentError) {
        console.error('Error obteniendo memorias recientes:', recentError);
      } else if (recent && recent.length > 0) {
        recent.forEach((mem, i) => {
          console.log(`${i+1}. ${mem.title}`);
          console.log(`   ID: ${mem.id}`);
          console.log(`   Usuario: ${mem.user_id}`);
          console.log(`   URL: ${mem.url}`);
          console.log(`   Creado: ${new Date(mem.created_at).toLocaleString()}\n`);
        });
      } else {
        console.log('No se encontraron memorias recientes');
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkSpecificMemory();