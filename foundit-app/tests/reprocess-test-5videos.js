require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role para admin access
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/youtube-transcript';
const INTERVAL_MINUTES = 2; // Reducido a 2 minutos para la prueba
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;
const TEST_LIMIT = 1; // Solo procesar 1 video para prueba

// Cliente Supabase con service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Estado del script
let processed = 0;
let errors = 0;
let startTime = new Date();
let processedVideos = []; // Para listar los videos procesados

// Función para logging con timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Función para formatear tiempo
function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Función para procesar un video individual
async function processVideo(video) {
  log(`🎥 Procesando: ${video.title}`);
  log(`📺 URL: ${video.url}`);
  
  const videoResult = {
    id: video.id,
    title: video.title,
    status: 'pending',
    error: null,
    transcriptLength: 0
  };
  
  try {
    // Llamar al webhook N8N
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        youtube_url: video.url,
        memory_id: video.id
      })
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status} - ${await response.text()}`);
    }

    const result = await response.json();
    
    if (result.status === 'completed') {
      // Actualizar el video en la base de datos - FORMATO CORRECTO
      const existingMetadata = typeof video.metadata === 'string' ? JSON.parse(video.metadata || '{}') : video.metadata || {};
      
      const updatedMetadata = {
        ...existingMetadata,
        youtube: {
          ...existingMetadata.youtube,
          transcript: result.transcript, // Aquí es donde la interfaz busca el transcript
          transcriptWithTimestamps: result.transcriptWithTimestamps,
          transcriptLanguage: 'en',
          transcriptSource: 'n8n-assemblyai',
          segments: [], // Por ahora vacío, podrías parsear timestamps si necesitas
        },
        processed_with_n8n: true,
        processed_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('memories')
        .update({
          content: result.transcript, // También mantener en content para búsquedas
          metadata: JSON.stringify(updatedMetadata),
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id);

      if (updateError) {
        throw new Error(`Error updating database: ${updateError.message}`);
      }

      log(`✅ ÉXITO: Video procesado y actualizado`);
      log(`📊 Transcript length: ${result.transcript.length} characters`);
      
      videoResult.status = 'success';
      videoResult.transcriptLength = result.transcript.length;
      
      processed++;
      return videoResult;
    } else {
      throw new Error(`N8N workflow failed: ${result.status}`);
    }
    
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    
    videoResult.status = 'error';
    videoResult.error = error.message;
    
    errors++;
    return videoResult;
  }
}

// Función principal
async function reprocessTestVideos() {
  log('🧪 PRUEBA: RE-PROCESAMIENTO DE 5 VIDEOS');
  log('=' * 60);
  
  try {
    // Obtener los primeros 5 videos de la base de datos
    log('📊 Obteniendo lista de videos...');
    const { data: videos, error } = await supabase
      .from('memories')
      .select('id, title, url, content, metadata')
      .not('url', 'is', null)
      .like('url', '%youtube.com%')
      .order('created_at', { ascending: true })
      .limit(TEST_LIMIT);

    if (error) {
      throw new Error(`Error fetching videos: ${error.message}`);
    }

    if (!videos || videos.length === 0) {
      log('⚠️  No se encontraron videos para procesar');
      return;
    }

    const totalVideos = videos.length;
    const estimatedTimeMs = totalVideos * INTERVAL_MS;
    const estimatedCompletion = new Date(Date.now() + estimatedTimeMs);
    
    log(`📈 ESTADÍSTICAS DE LA PRUEBA:`);
    log(`   • Videos a procesar: ${totalVideos}`);
    log(`   • Intervalo entre videos: ${INTERVAL_MINUTES} minutos`);
    log(`   • Tiempo estimado total: ${formatDuration(estimatedTimeMs)}`);
    log(`   • Finalización estimada: ${estimatedCompletion.toLocaleString()}`);
    log(`   • Costo estimado: ~$${(totalVideos * 0.25).toFixed(2)} USD`);
    log('=' * 60);

    // Procesar cada video
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoNum = i + 1;
      
      log(`\n🎬 VIDEO ${videoNum}/${totalVideos}`);
      log('-' * 40);
      
      // Procesar el video
      const result = await processVideo(video);
      processedVideos.push(result);
      
      // Mostrar estadísticas actuales
      const elapsed = Date.now() - startTime.getTime();
      const remaining = totalVideos - videoNum;
      const estimatedRemaining = remaining * INTERVAL_MS;
      
      log(`\n📊 PROGRESO ACTUAL:`);
      log(`   • Completados: ${processed}/${totalVideos} (${Math.round(processed/totalVideos*100)}%)`);
      log(`   • Errores: ${errors}`);
      log(`   • Tiempo transcurrido: ${formatDuration(elapsed)}`);
      if (remaining > 0) {
        log(`   • Tiempo restante estimado: ${formatDuration(estimatedRemaining)}`);
      }
      
      // Esperar antes del siguiente video (excepto el último)
      if (i < videos.length - 1) {
        log(`\n⏳ Esperando ${INTERVAL_MINUTES} minutos antes del siguiente video...`);
        log(`   Próximo video: "${videos[i + 1].title}"`);
        
        await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
      }
    }
    
    // Estadísticas finales
    const totalElapsed = Date.now() - startTime.getTime();
    log('\n' + '=' * 60);
    log('🎉 PRUEBA DE RE-PROCESAMIENTO COMPLETADA');
    log('=' * 60);
    log(`📊 ESTADÍSTICAS FINALES:`);
    log(`   • Videos procesados exitosamente: ${processed}/${totalVideos}`);
    log(`   • Videos con errores: ${errors}/${totalVideos}`);
    log(`   • Tiempo total: ${formatDuration(totalElapsed)}`);
    log(`   • Tasa de éxito: ${Math.round(processed/totalVideos*100)}%`);
    log(`   • Costo aproximado: ~$${(processed * 0.25).toFixed(2)} USD`);
    
    // Mostrar resumen de videos procesados
    log('\n📋 RESUMEN DE VIDEOS PROCESADOS:');
    log('-' * 60);
    processedVideos.forEach((video, index) => {
      const status = video.status === 'success' ? '✅' : '❌';
      const details = video.status === 'success' 
        ? `(${video.transcriptLength} chars)`
        : `(Error: ${video.error})`;
      log(`${index + 1}. ${status} ${video.title} ${details}`);
    });
    
    if (errors === 0) {
      log('\n🚀 ¡Perfecto! Todos los videos se procesaron exitosamente.');
      log('   Puedes proceder con el script completo para los 50 videos.');
    } else {
      log(`\n⚠️  Nota: ${errors} videos tuvieron errores. Revisa los logs para más detalles.`);
    }
    
  } catch (error) {
    log(`💥 ERROR CRÍTICO: ${error.message}`);
    process.exit(1);
  }
}

// Manejo de señales para terminar gracefully
process.on('SIGINT', () => {
  log('\n🛑 Recibida señal de terminación. Finalizando gracefully...');
  log(`📊 Videos procesados hasta ahora: ${processed}`);
  log(`❌ Errores hasta ahora: ${errors}`);
  
  if (processedVideos.length > 0) {
    log('\n📋 Videos procesados:');
    processedVideos.forEach((video, index) => {
      const status = video.status === 'success' ? '✅' : '❌';
      log(`${index + 1}. ${status} ${video.title}`);
    });
  }
  
  process.exit(0);
});

// Validar configuración antes de empezar
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Ejecutar el script
reprocessTestVideos().catch(error => {
  log(`💥 Error no manejado: ${error.message}`);
  process.exit(1);
});