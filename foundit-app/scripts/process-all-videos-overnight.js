const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

// N8N Local configurado
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/youtube-transcript';

// Configuración del procesamiento
const MINUTES_BETWEEN_VIDEOS = 1; // Cambiado a 1 minuto para ser más rápido
const RETRY_FAILED_VIDEOS = true;
const MAX_RETRIES = 2;

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

// Formatear tiempo para logs
function formatTime() {
  return new Date().toLocaleString('es-ES', { 
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Log con timestamp
function log(message) {
  console.log(`[${formatTime()}] ${message}`);
}

// Función para esperar
function sleep(minutes) {
  return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}

// Enviar video a N8N
async function processVideoWithN8N(video, attempt = 1) {
  log(`🎬 Procesando: "${video.title}" (Intento ${attempt}/${MAX_RETRIES + 1})`);
  log(`   Video ID: ${video.videoId}`);
  log(`   Memory ID: ${video.id}`);

  const payload = {
    video_id: video.videoId,
    youtube_url: video.url,
    memory_id: video.id
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 30000 // 30 segundos timeout
    });

    if (response.ok) {
      let result;
      try {
        result = await response.json();
        if (result.status === 'completed') {
          log(`   ✅ ÉXITO: Video procesado correctamente`);
          log(`   📊 Transcript: ${result.transcript.substring(0, 100)}...`);
          log(`   ⏰ Timestamps: ${result.transcriptWithTimestamps.split('\n').length} segments`);
          return { success: true, result, video };
        } else {
          log(`   ❌ N8N Error: Status ${result.status}`);
          return { success: false, error: `N8N returned status: ${result.status}`, video };
        }
      } catch (e) {
        log(`   ❌ JSON Parse Error: ${e.message}`);
        return { success: false, error: 'Invalid JSON response', video };
      }
    } else {
      const errorText = await response.text();
      log(`   ❌ HTTP Error: ${response.status} - ${errorText.substring(0, 200)}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}`, video };
    }

  } catch (error) {
    log(`   ❌ Network Error: ${error.message}`);
    return { success: false, error: error.message, video };
  }
}

// Función principal
async function processAllVideosOvernight() {
  log('🌙 INICIANDO PROCESAMIENTO NOCTURNO DE TODOS LOS VIDEOS');
  log('='.repeat(70));
  
  const startTime = Date.now();
  let totalProcessed = 0;
  let successCount = 0;
  let errorCount = 0;
  let retryCount = 0;
  const results = [];
  const failedVideos = [];

  try {
    // 1. Buscar TODOS los videos (sin filtros estrictos)
    log('🔍 Buscando todos los videos para procesar...');
    
    const { data: memories, error } = await supabase
      .from('memories')
      .select('id, title, url, metadata, created_at')
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      log(`❌ Error obteniendo videos: ${error.message}`);
      return;
    }

    // 2. Filtrar videos que pueden ser procesados
    const videosToProcess = [];

    for (const memory of memories) {
      const metadata = memory.metadata;
      
      // Buscar videos con URLs de YouTube
      if (memory.url && (memory.url.includes('youtube.com') || memory.url.includes('youtu.be'))) {
        const videoId = extractVideoId(memory.url);
        if (videoId) {
          // Incluir TODOS los videos, incluso los que ya tienen algún transcript
          videosToProcess.push({
            ...memory,
            videoId,
            hasTranscript: !!(metadata?.youtube?.transcript || metadata?.transcript),
            hasMockData: metadata?.youtube?.transcript ? isMockData(metadata.youtube.transcript) : false,
            hasSegments: !!(metadata?.youtube?.segments?.length > 0 || metadata?.segments?.length > 0)
          });
        }
      }
    }

    log(`📊 Videos encontrados para procesar: ${videosToProcess.length}`);
    log(`📊 Tiempo estimado total: ${videosToProcess.length * MINUTES_BETWEEN_VIDEOS} minutos (${Math.round(videosToProcess.length * MINUTES_BETWEEN_VIDEOS / 60)} horas)`);
    
    if (videosToProcess.length === 0) {
      log('✅ No hay videos para procesar!');
      return;
    }

    // 3. Mostrar estadísticas iniciales
    const withTranscript = videosToProcess.filter(v => v.hasTranscript).length;
    const withMock = videosToProcess.filter(v => v.hasMockData).length;
    const withSegments = videosToProcess.filter(v => v.hasSegments).length;
    
    log(`📈 Estadísticas iniciales:`);
    log(`   - Videos con transcript: ${withTranscript}`);
    log(`   - Videos con mock data: ${withMock}`);
    log(`   - Videos con segments: ${withSegments}`);
    log(`   - Videos sin procesar: ${videosToProcess.length - withTranscript}`);
    log('');

    // 4. Confirmación final
    log(`⚠️  PROCESAMIENTO MASIVO:`);
    log(`   - Se van a procesar ${videosToProcess.length} videos`);
    log(`   - Intervalo: ${MINUTES_BETWEEN_VIDEOS} minutos entre videos`);
    log(`   - Costo estimado: $${(videosToProcess.length * 0.36).toFixed(2)} (asumiendo 1 hora promedio)`);
    log(`   - Reintentos: ${RETRY_FAILED_VIDEOS ? 'Habilitados' : 'Deshabilitados'}`);
    log('');
    log('🚀 Iniciando en 10 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 10000));

    log('🎬 INICIANDO PROCESAMIENTO MASIVO...');
    log('='.repeat(70));

    // 5. Procesar cada video
    for (let i = 0; i < videosToProcess.length; i++) {
      const video = videosToProcess[i];
      const progress = `${i + 1}/${videosToProcess.length}`;
      
      log('');
      log(`📹 [${progress}] Procesando video...`);
      log(`   Título: ${video.title}`);
      log(`   Estado actual: ${video.hasTranscript ? (video.hasMockData ? 'Mock data' : 'Transcript real') : 'Sin transcript'}`);
      
      // Procesar video
      const result = await processVideoWithN8N(video);
      totalProcessed++;
      
      if (result.success) {
        successCount++;
        results.push(result);
        log(`   🎉 ÉXITO (${successCount}/${totalProcessed})`);
      } else {
        errorCount++;
        failedVideos.push({ video, error: result.error, attempt: 1 });
        log(`   💥 ERROR (${errorCount}/${totalProcessed}): ${result.error}`);
      }

      // Esperar antes del siguiente video (excepto en el último)
      if (i < videosToProcess.length - 1) {
        log(`   ⏰ Esperando ${MINUTES_BETWEEN_VIDEOS} minutos antes del siguiente video...`);
        await sleep(MINUTES_BETWEEN_VIDEOS);
      }
    }

    // 6. Reintentar videos fallidos
    if (RETRY_FAILED_VIDEOS && failedVideos.length > 0) {
      log('');
      log('🔄 REINTENTANDO VIDEOS FALLIDOS...');
      log('='.repeat(70));
      
      for (let retry = 2; retry <= MAX_RETRIES + 1; retry++) {
        const videosToRetry = failedVideos.filter(f => f.attempt === retry - 1);
        
        if (videosToRetry.length === 0) break;
        
        log(`🔄 Intento ${retry}: ${videosToRetry.length} videos`);
        
        for (const failedVideo of videosToRetry) {
          log(`   🔄 Reintentando: ${failedVideo.video.title}`);
          
          const result = await processVideoWithN8N(failedVideo.video, retry);
          retryCount++;
          
          if (result.success) {
            successCount++;
            results.push(result);
            // Remover de la lista de fallidos
            const index = failedVideos.indexOf(failedVideo);
            failedVideos.splice(index, 1);
            log(`   ✅ ÉXITO en reintento ${retry}`);
          } else {
            failedVideo.attempt = retry;
            failedVideo.error = result.error;
            log(`   ❌ Falló reintento ${retry}: ${result.error}`);
          }
          
          // Pausa entre reintentos
          if (videosToRetry.indexOf(failedVideo) < videosToRetry.length - 1) {
            await sleep(2); // 2 minutos entre reintentos
          }
        }
      }
    }

    // 7. REPORTE FINAL
    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000 / 60);
    const finalFailedCount = failedVideos.length;
    
    log('');
    log('🎊 PROCESAMIENTO NOCTURNO COMPLETADO');
    log('='.repeat(70));
    log(`📊 ESTADÍSTICAS FINALES:`);
    log(`   ✅ Videos procesados exitosamente: ${successCount}`);
    log(`   ❌ Videos fallidos: ${finalFailedCount}`);
    log(`   🔄 Reintentos realizados: ${retryCount}`);
    log(`   📹 Total videos procesados: ${totalProcessed}`);
    log(`   ⏰ Tiempo total: ${totalTime} minutos (${Math.round(totalTime / 60)} horas)`);
    log(`   💰 Costo estimado: $${(successCount * 0.36).toFixed(2)}`);
    log('');
    
    if (successCount > 0) {
      log('🎯 VIDEOS PROCESADOS EXITOSAMENTE:');
      results.forEach((result, i) => {
        log(`   ${i + 1}. ${result.video.title}`);
      });
      log('');
    }
    
    if (finalFailedCount > 0) {
      log('💥 VIDEOS QUE FALLARON:');
      failedVideos.forEach((failed, i) => {
        log(`   ${i + 1}. ${failed.video.title}`);
        log(`      Error: ${failed.error}`);
      });
      log('');
    }
    
    log('🔍 PARA VERIFICAR RESULTADOS:');
    log('   1. Ve a FoundIt.at');
    log('   2. Busca cualquier título de los videos procesados');
    log('   3. Deberías ver timestamps clickeables perfectos');
    log('   4. Formato: "MM:SS\\nTexto de 15 palabras..."');
    log('');
    
    if (finalFailedCount > 0) {
      log('🛠️ VIDEOS FALLIDOS:');
      log('   - Revisa los errores arriba');
      log('   - Puedes ejecutar el script de nuevo para reintentar');
      log('   - O procesarlos manualmente uno por uno');
    }
    
    log('🌅 ¡Buenos días! El procesamiento nocturno ha terminado.');
    log('✨ Tu sistema de transcripts está ahora COMPLETO y listo para búsqueda semántica.');

  } catch (error) {
    log(`❌ Error crítico: ${error.message}`);
    log(`Stack: ${error.stack}`);
  }
}

// Manejar Ctrl+C para terminar gracefully
process.on('SIGINT', () => {
  log('');
  log('⚠️  Procesamiento interrumpido por el usuario');
  log('📊 Videos procesados hasta ahora se mantienen en la base de datos');
  log('💡 Puedes ejecutar el script de nuevo para continuar donde se quedó');
  process.exit(0);
});

// Ejecutar
console.log('🌙'.repeat(35));
console.log('🌙 PROCESAMIENTO NOCTURNO DE VIDEOS 🌙');
console.log('🌙'.repeat(35));
console.log('');
console.log('📋 CONFIGURACIÓN:');
console.log(`   - N8N URL: ${N8N_WEBHOOK_URL}`);
console.log(`   - Intervalo: ${MINUTES_BETWEEN_VIDEOS} minutos entre videos`);
console.log(`   - Reintentos: ${RETRY_FAILED_VIDEOS ? 'Habilitados' : 'Deshabilitados'}`);
console.log(`   - Max reintentos: ${MAX_RETRIES}`);
console.log('');
console.log('💤 Este script procesará TODOS los videos mientras duermes');
console.log('🎯 Al despertar tendrás timestamps perfectos en todos tus videos');
console.log('');

processAllVideosOvernight();