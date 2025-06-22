const { createClient } = require('@supabase/supabase-js');
const { YoutubeTranscript } = require('youtube-transcript');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para convertir milisegundos a formato MM:SS
function formatTimestamp(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Detectar si es mock data
function isMockData(transcript) {
  return transcript && transcript.includes('Welcome to this comprehensive video about');
}

// Función principal
async function migrateRealTranscripts() {
  console.log('🔍 Buscando videos con transcripts REALES sin timestamps...\n');

  try {
    // Buscar TODOS los videos con metadata de YouTube
    const { data: memories, error } = await supabase
      .from('memories')
      .select('id, title, url, metadata, created_at')
      .or('type.eq.video,type.eq.document,type.eq.link')
      .not('metadata->youtube', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📊 Total videos con metadata YouTube: ${memories.length}\n`);

    // Filtrar videos que necesitan actualización
    const needsUpdate = [];
    let mockCount = 0;
    let hasSegmentsCount = 0;

    for (const memory of memories) {
      const youtube = memory.metadata?.youtube;
      
      if (!youtube?.transcript) continue;
      
      // Detectar tipo de transcript
      if (isMockData(youtube.transcript)) {
        mockCount++;
        continue;
      }

      // Si ya tiene segments, no necesita actualización
      if (youtube.segments && youtube.segments.length > 0) {
        hasSegmentsCount++;
        continue;
      }

      // Este video tiene transcript REAL pero NO segments
      needsUpdate.push(memory);
    }

    console.log('📊 Análisis de videos:');
    console.log(`   - Con mock data: ${mockCount}`);
    console.log(`   - Ya tienen segments: ${hasSegmentsCount}`);
    console.log(`   - Necesitan actualización: ${needsUpdate.length}`);
    console.log('');

    if (needsUpdate.length === 0) {
      console.log('✅ No hay videos que actualizar!');
      return;
    }

    // Confirmar antes de proceder
    console.log(`Se van a actualizar ${needsUpdate.length} videos.`);
    console.log('Iniciando en 3 segundos... (Ctrl+C para cancelar)\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Procesar cada video
    let successCount = 0;
    let errorCount = 0;

    for (const memory of needsUpdate) {
      console.log(`\n🎬 Procesando: ${memory.title}`);
      
      // Extraer video ID
      const match = memory.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = match ? match[1] : null;

      if (!videoId) {
        console.log('❌ No se pudo extraer video ID');
        errorCount++;
        continue;
      }

      console.log(`   Video ID: ${videoId}`);
      console.log(`   Transcript actual: ${memory.metadata.youtube.transcript.substring(0, 50)}...`);

      try {
        // Intentar obtener transcript con timestamps de YouTube
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (transcript && transcript.length > 0) {
          // Verificar si el transcript coincide
          const firstWords = transcript.slice(0, 5).map(t => t.text).join(' ');
          console.log(`   Primeras palabras de YouTube: "${firstWords.substring(0, 50)}..."`);
          
          // Crear segments
          const segments = transcript.map(entry => ({
            text: entry.text.replace(/\[.*?\]/g, '').trim(),
            offset: entry.offset,
            duration: entry.duration || 2000,
            startTime: formatTimestamp(entry.offset)
          })).filter(segment => segment.text.length > 0);

          console.log(`   ✅ Encontrados ${segments.length} segments`);

          // Actualizar en base de datos
          const updatedMetadata = {
            ...memory.metadata,
            youtube: {
              ...memory.metadata.youtube,
              segments: segments,
              transcriptSource: 'youtube_api' // Corregir el source
            }
          };

          const { error: updateError } = await supabase
            .from('memories')
            .update({ metadata: updatedMetadata })
            .eq('id', memory.id);

          if (updateError) {
            console.error('   ❌ Error al actualizar:', updateError);
            errorCount++;
          } else {
            console.log('   ✅ Actualizado correctamente');
            successCount++;
          }
        } else {
          console.log('   ❌ No se encontró transcript en YouTube');
          errorCount++;
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }

      // Pausa entre videos
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(50));
    console.log(`✅ Videos actualizados: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📹 Total procesado: ${needsUpdate.length}`);
    
    if (successCount > 0) {
      console.log('\n✨ Los videos actualizados ahora tienen timestamps clickeables!');
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar
console.log('='.repeat(50));
console.log('🔧 MIGRACIÓN DE TRANSCRIPTS REALES');
console.log('='.repeat(50));
console.log('Este script actualiza solo videos con transcripts REALES\n');

migrateRealTranscripts();