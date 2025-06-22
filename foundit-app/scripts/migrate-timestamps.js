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

// Función para obtener transcript con timestamps de YouTube
async function getYouTubeTranscriptWithTimestamps(videoId) {
  try {
    console.log(`📺 Obteniendo transcript para video ID: ${videoId}`);
    
    // Intentar obtener transcript en cualquier idioma disponible
    let transcript = null;
    let language = null;
    
    // Lista de idiomas a intentar en orden
    const languagesToTry = [
      { lang: 'es', name: 'español' },
      { lang: 'es-ES', name: 'español (ES)' },
      { lang: 'en', name: 'inglés' },
      { lang: 'en-US', name: 'inglés (US)' }
    ];
    
    for (const { lang, name } of languagesToTry) {
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        if (transcript && transcript.length > 0) {
          console.log(`✅ Transcript encontrado en ${name}`);
          language = lang;
          break;
        }
      } catch (e) {
        // Continuar con el siguiente idioma
      }
    }
    
    // Si no se encontró con idiomas específicos, intentar sin especificar idioma
    if (!transcript) {
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
        if (transcript && transcript.length > 0) {
          console.log(`✅ Transcript encontrado (idioma automático)`);
          language = 'auto';
        }
      } catch (e) {
        // No hay transcript disponible
      }
    }

    if (transcript && transcript.length > 0) {
      const segments = transcript.map(entry => ({
        text: entry.text.replace(/\[.*?\]/g, '').trim(),
        offset: entry.offset,
        duration: entry.duration || 2000,
        startTime: formatTimestamp(entry.offset)
      })).filter(segment => segment.text.length > 0);

      console.log(`✅ Encontrados ${segments.length} segmentos`);
      return { segments, language };
    }

    console.log('❌ No se encontraron transcripts disponibles');
    return null;

  } catch (error) {
    console.error(`❌ Error obteniendo transcript:`, error.message);
    return null;
  }
}

// Función principal de migración
async function migrateTimestamps() {
  console.log('🚀 Iniciando migración de timestamps...\n');

  try {
    // 1. Buscar memorias de tipo video que tienen transcript pero NO segments
    console.log('🔍 Buscando videos sin timestamps...');
    
    const { data: memories, error } = await supabase
      .from('memories')
      .select('id, title, url, metadata')
      .or('type.eq.video,type.eq.document,type.eq.link')
      .not('metadata->youtube->transcript', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al buscar memorias:', error);
      return;
    }

    // Filtrar solo los que NO tienen segments
    const memoriesWithoutSegments = memories.filter(memory => {
      const hasTranscript = memory.metadata?.youtube?.transcript;
      const hasSegments = memory.metadata?.youtube?.segments?.length > 0;
      return hasTranscript && !hasSegments;
    });

    console.log(`📊 Encontrados ${memoriesWithoutSegments.length} videos sin timestamps\n`);

    if (memoriesWithoutSegments.length === 0) {
      console.log('✅ ¡Todos los videos ya tienen timestamps!');
      return;
    }

    // 2. Procesar cada video
    let successCount = 0;
    let errorCount = 0;
    
    // Limitar a los primeros 5 videos para prueba
    const videosToProcess = memoriesWithoutSegments.slice(0, 5);
    console.log(`\n⚠️  MODO PRUEBA: Procesando solo los primeros ${videosToProcess.length} videos\n`);

    for (const memory of videosToProcess) {
      console.log(`\n🎬 Procesando: ${memory.title}`);
      
      // Extraer video ID
      let videoId = memory.metadata?.youtube?.videoId;
      
      if (!videoId && memory.url) {
        // Intentar extraer de la URL
        const match = memory.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        videoId = match ? match[1] : null;
      }

      if (!videoId) {
        console.log('❌ No se pudo obtener video ID');
        errorCount++;
        continue;
      }

      console.log(`   Video ID: ${videoId}`);

      // Obtener transcript con timestamps
      const result = await getYouTubeTranscriptWithTimestamps(videoId);
      
      if (!result) {
        console.log('❌ No se pudieron obtener timestamps');
        errorCount++;
        continue;
      }

      // 3. Actualizar la memoria con los segments
      const updatedMetadata = {
        ...memory.metadata,
        youtube: {
          ...memory.metadata.youtube,
          segments: result.segments,
          transcriptLanguage: result.language
        }
      };

      const { error: updateError } = await supabase
        .from('memories')
        .update({ metadata: updatedMetadata })
        .eq('id', memory.id);

      if (updateError) {
        console.error('❌ Error al actualizar:', updateError);
        errorCount++;
      } else {
        console.log(`✅ Actualizado con ${result.segments.length} timestamps`);
        successCount++;
      }

      // Pequeña pausa para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE MIGRACIÓN:');
    console.log('='.repeat(50));
    console.log(`✅ Videos actualizados exitosamente: ${successCount}`);
    console.log(`❌ Videos con errores: ${errorCount}`);
    console.log(`📹 Total procesado: ${videosToProcess.length} de ${memoriesWithoutSegments.length}`);
    console.log('='.repeat(50));
    
    if (successCount > 0) {
      console.log('\n✨ ¡Actualización exitosa!');
      console.log('Los videos actualizados ahora tienen timestamps clickeables en las búsquedas.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar migración
console.log('='.repeat(50));
console.log('🔧 MIGRACIÓN DE TIMESTAMPS PARA FOUNDIT.AT');
console.log('='.repeat(50));
console.log('Este script actualizará los transcripts viejos con timestamps.\n');
console.log('⚠️  IMPORTANTE:');
console.log('- Solo actualiza videos que tienen transcript pero NO segments');
console.log('- Usa YouTube API (GRATIS)');
console.log('- No modifica otros datos (AI summary, etc.)');
console.log('- Procesa un video cada segundo para evitar límites\n');

// Dar 3 segundos para cancelar si es necesario
console.log('Iniciando en 3 segundos... (Ctrl+C para cancelar)\n');
setTimeout(() => {
  migrateTimestamps();
}, 3000);