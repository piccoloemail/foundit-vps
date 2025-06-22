const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role para admin access
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/youtube-transcript';
const INTERVAL_MINUTES = 5;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000; // 5 minutos en milisegundos

// Cliente Supabase con service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Estado del script
let processed = 0;
let errors = 0;
let startTime = new Date();

// Función para logging con timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Función para formatear tiempo
function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

// Función para procesar un video individual
async function processVideo(video) {
  log(`🎥 Procesando: ${video.title} (ID: ${video.id})`);
  log(`📺 URL: ${video.youtube_url}`);
  
  try {
    // Llamar al webhook N8N
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        youtube_url: video.youtube_url,
        memory_id: video.id
      })
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status} - ${await response.text()}`);
    }

    const result = await response.json();
    
    if (result.status === 'completed') {
      // Actualizar el video en la base de datos
      const { error: updateError } = await supabase
        .from('memories')
        .update({
          transcript: result.transcript,
          transcript_with_timestamps: result.transcriptWithTimestamps,
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id);

      if (updateError) {
        throw new Error(`Error updating database: ${updateError.message}`);
      }

      log(`✅ ÉXITO: Video procesado y actualizado`);
      log(`📊 Transcript length: ${result.transcript.length} characters`);
      
      processed++;
      return true;
    } else {
      throw new Error(`N8N workflow failed: ${result.status}`);
    }
    
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    errors++;
    return false;
  }
}

// Función principal
async function reprocessAllVideos() {
  log('🚀 INICIANDO RE-PROCESAMIENTO DE TODOS LOS VIDEOS');
  log('=' * 60);
  
  try {
    // Obtener todos los videos de la base de datos
    log('📊 Obteniendo lista de videos...');
    const { data: videos, error } = await supabase
      .from('memories')
      .select('id, title, youtube_url, transcript')
      .not('youtube_url', 'is', null)
      .order('created_at', { ascending: true });

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
    
    log(`📈 ESTADÍSTICAS INICIALES:`);
    log(`   • Total de videos: ${totalVideos}`);
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
      const success = await processVideo(video);
      
      // Mostrar estadísticas actuales
      const elapsed = Date.now() - startTime.getTime();
      const remaining = totalVideos - videoNum;
      const estimatedRemaining = remaining * INTERVAL_MS;
      const completionTime = new Date(Date.now() + estimatedRemaining);
      
      log(`\n📊 PROGRESO ACTUAL:`);
      log(`   • Completados: ${processed}/${totalVideos} (${Math.round(processed/totalVideos*100)}%)`);
      log(`   • Errores: ${errors}`);
      log(`   • Tiempo transcurrido: ${formatDuration(elapsed)}`);
      log(`   • Tiempo restante estimado: ${formatDuration(estimatedRemaining)}`);
      log(`   • Finalización estimada: ${completionTime.toLocaleString()}`);
      
      // Esperar 5 minutos antes del siguiente video (excepto el último)
      if (i < videos.length - 1) {
        log(`\n⏳ Esperando ${INTERVAL_MINUTES} minutos antes del siguiente video...`);
        log(`   Próximo video: "${videos[i + 1].title}"`);
        
        // Countdown cada minuto
        for (let minute = INTERVAL_MINUTES; minute > 0; minute--) {
          await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minuto
          if (minute > 1) {
            log(`   ⏰ ${minute - 1} minutos restantes...`);
          }
        }
      }
    }
    
    // Estadísticas finales
    const totalElapsed = Date.now() - startTime.getTime();
    log('\n' + '=' * 60);
    log('🎉 RE-PROCESAMIENTO COMPLETADO');
    log('=' * 60);
    log(`📊 ESTADÍSTICAS FINALES:`);
    log(`   • Videos procesados exitosamente: ${processed}/${totalVideos}`);
    log(`   • Videos con errores: ${errors}/${totalVideos}`);
    log(`   • Tiempo total: ${formatDuration(totalElapsed)}`);
    log(`   • Tasa de éxito: ${Math.round(processed/totalVideos*100)}%`);
    log(`   • Costo aproximado: ~$${(processed * 0.25).toFixed(2)} USD`);
    
    if (errors > 0) {
      log(`\n⚠️  Nota: ${errors} videos tuvieron errores y podrían necesitar reprocesamiento manual`);
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
  process.exit(0);
});

// Validar configuración antes de empezar
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Ejecutar el script
reprocessAllVideos().catch(error => {
  log(`💥 Error no manejado: ${error.message}`);
  process.exit(1);
});