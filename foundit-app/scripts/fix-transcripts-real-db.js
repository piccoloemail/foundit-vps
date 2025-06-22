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
  if (!transcript) return false;
  return transcript.includes('Welcome to this comprehensive video about') ||
         transcript.includes('I apologize') ||
         transcript.length < 100;
}

// Extraer video ID de URL
function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

// Función principal
async function fixTranscriptsRealDB() {
  console.log('🔍 Analizando estructura real de DB...\n');

  try {
    // 1. Buscar todos los videos con metadata
    const { data: memories, error } = await supabase
      .from('memories')
      .select('id, title, url, metadata, created_at')
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📊 Total memories con metadata: ${memories.length}\n`);

    // 2. Analizar estructura de metadata
    let youtubeCount = 0;
    let hasTranscriptCount = 0;
    let hasSegmentsCount = 0;
    let mockDataCount = 0;
    let needsUpdateCount = 0;
    
    const needsUpdate = [];

    for (const memory of memories) {
      const metadata = memory.metadata;
      
      // Debug: mostrar structure del primer metadata
      if (youtubeCount === 0) {
        console.log('🔍 Estructura metadata ejemplo:');
        console.log(JSON.stringify(metadata, null, 2).substring(0, 300) + '...\n');
      }

      // Verificar si tiene data de YouTube
      if (metadata?.youtube || metadata?.videoId || metadata?.transcript) {
        youtubeCount++;
        
        // Buscar transcript en diferentes ubicaciones
        let transcript = null;
        let segments = null;
        
        if (metadata.youtube?.transcript) {
          transcript = metadata.youtube.transcript;
          segments = metadata.youtube.segments;
        } else if (metadata.transcript) {
          transcript = metadata.transcript;
          segments = metadata.segments;
        }

        if (transcript) {
          hasTranscriptCount++;
          
          if (isMockData(transcript)) {
            mockDataCount++;
          } else if (!segments || segments.length === 0) {
            // Transcript real pero sin segments - NECESITA UPDATE
            needsUpdateCount++;
            needsUpdate.push({
              ...memory,
              transcript,
              transcriptLocation: metadata.youtube?.transcript ? 'youtube' : 'root'
            });
          } else {
            hasSegmentsCount++;
          }
        }
      }
    }

    console.log('📊 Análisis completo:');
    console.log(`   - Memories con YouTube data: ${youtubeCount}`);
    console.log(`   - Con transcript: ${hasTranscriptCount}`);
    console.log(`   - Con mock data: ${mockDataCount}`);
    console.log(`   - Ya tienen segments: ${hasSegmentsCount}`);
    console.log(`   - NECESITAN UPDATE: ${needsUpdateCount}`);
    console.log('');

    if (needsUpdate.length === 0) {
      console.log('✅ No hay videos que necesiten timestamps!');
      return;
    }

    // 3. Mostrar videos que se van a procesar
    console.log('🎬 Videos que necesitan timestamps:');
    needsUpdate.slice(0, 5).forEach((memory, i) => {
      console.log(`   ${i+1}. ${memory.title}`);
      console.log(`      URL: ${memory.url}`);
      console.log(`      Transcript: ${memory.transcript.substring(0, 80)}...`);
      console.log('');
    });

    // Confirmar antes de proceder (intentar hasta encontrar uno que funcione)
    const toProcess = needsUpdate.slice(0, 5); // Intentar hasta 5 videos
    console.log(`⚠️  MODO PRUEBA: Se va a procesar SOLO 1 video de ${needsUpdate.length}`);
    console.log(`🎯 Video a procesar: "${toProcess[0]?.title}"`);
    console.log('Iniciando en 3 segundos... (Ctrl+C para cancelar)\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Procesar cada video
    let successCount = 0;
    let errorCount = 0;

    for (const memory of toProcess) {
      console.log(`\n🎬 Procesando: ${memory.title}`);
      
      const videoId = extractVideoId(memory.url);
      if (!videoId) {
        console.log('❌ No se pudo extraer video ID');
        errorCount++;
        continue;
      }

      console.log(`   Video ID: ${videoId}`);

      try {
        // Obtener transcript con timestamps de YouTube API
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (transcript && transcript.length > 0) {
          const segments = transcript.map(entry => ({
            text: entry.text.replace(/\[.*?\]/g, '').trim(),
            offset: entry.offset,
            duration: entry.duration || 2000,
            startTime: formatTimestamp(entry.offset)
          })).filter(segment => segment.text.length > 0);

          console.log(`   ✅ Encontrados ${segments.length} segments`);

          // 5. Actualizar metadata manteniendo estructura existente
          let updatedMetadata;
          
          if (memory.transcriptLocation === 'youtube') {
            // Transcript está en metadata.youtube
            updatedMetadata = {
              ...memory.metadata,
              youtube: {
                ...memory.metadata.youtube,
                segments: segments,
                transcriptSource: 'youtube_api',
                hasTimestamps: true
              }
            };
          } else {
            // Transcript está en metadata root
            updatedMetadata = {
              ...memory.metadata,
              segments: segments,
              transcriptSource: 'youtube_api',
              hasTimestamps: true
            };
          }

          const { error: updateError } = await supabase
            .from('memories')
            .update({ metadata: updatedMetadata })
            .eq('id', memory.id);

          if (updateError) {
            console.error('   ❌ Error al actualizar:', updateError);
            errorCount++;
          } else {
            console.log('   ✅ Actualizado correctamente');
            console.log(`   🎯 VIDEO PROCESADO: "${memory.title}"`);
            console.log(`   📺 URL: ${memory.url}`);
            console.log(`   ⏰ Segments añadidos: ${segments.length}`);
            successCount++;
          }
        } else {
          console.log('   ❌ No se encontró transcript en YouTube - probando siguiente video...');
          errorCount++;
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message} - probando siguiente video...`);
        errorCount++;
      }

      // Si ya tenemos un éxito, salir del loop
      if (successCount > 0) {
        console.log('   ✅ Un video procesado exitosamente - parando aquí para testing');
        break;
      }

      // Pausa entre videos
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 6. Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(50));
    console.log(`✅ Videos actualizados: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📹 Total procesado: ${toProcess.length} de ${needsUpdate.length}`);
    console.log(`🎯 Pending: ${needsUpdate.length - toProcess.length} videos más`);
    
    if (successCount > 0) {
      console.log('\n✨ ¡Video actualizado con timestamps clickeables!');
      console.log('\n🔍 PARA VERIFICAR:');
      console.log(`   1. Ve a FoundIt.at y busca: "${toProcess[0]?.title}"`);
      console.log(`   2. O busca alguna palabra del video`);
      console.log(`   3. Deberías ver timestamps clickeables en los snippets`);
      console.log('\n📋 Si funciona bien, ejecuta el script de nuevo para procesar más videos.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
console.log('='.repeat(50));
console.log('🔧 FIX TRANSCRIPTS - ESTRUCTURA REAL DB');
console.log('='.repeat(50));
console.log('Script adaptado a la estructura real de Supabase\n');

fixTranscriptsRealDB();