const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

// N8N Local configurado
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/youtube-transcript';

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

// Función principal
async function testSingleVideoWithDbUpdate(videoUrl) {
  log('🧪 PRUEBA: Procesar video específico Y actualizar base de datos');
  log('='.repeat(70));
  
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    log('❌ URL de YouTube inválida');
    return;
  }
  
  log(`🎬 Video URL: ${videoUrl}`);
  log(`🆔 Video ID: ${videoId}`);
  log('');

  try {
    // 1. Buscar la memoria en Supabase
    log('🔍 Buscando memoria en Supabase...');
    
    const { data: memories, error: searchError } = await supabase
      .from('memories')
      .select('id, title, url, metadata, created_at')
      .ilike('url', `%${videoId}%`);

    if (searchError) {
      log(`❌ Error buscando memoria: ${searchError.message}`);
      return;
    }

    if (!memories || memories.length === 0) {
      log('❌ No se encontró memoria con esa URL');
      log('💡 Asegúrate de que el video esté en tu base de datos primero');
      return;
    }

    const memory = memories[0];
    log(`✅ Memoria encontrada: "${memory.title}"`);
    log(`📅 Memory ID: ${memory.id}`);
    log(`📅 Creada: ${new Date(memory.created_at).toLocaleString()}`);
    log('');

    // 2. Mostrar estado actual
    const currentMetadata = memory.metadata || {};
    const hasCurrentTranscript = !!(currentMetadata?.youtube?.transcript || currentMetadata?.transcript);
    const hasCurrentSegments = !!(currentMetadata?.youtube?.segments?.length > 0 || currentMetadata?.segments?.length > 0);
    
    log('📊 Estado actual de la memoria:');
    log(`   Tiene transcript: ${hasCurrentTranscript ? '✅ Sí' : '❌ No'}`);
    log(`   Tiene segments: ${hasCurrentSegments ? '✅ Sí' : '❌ No'}`);
    if (hasCurrentTranscript) {
      const currentTranscript = currentMetadata?.youtube?.transcript || currentMetadata?.transcript || '';
      log(`   Transcript preview: ${currentTranscript.substring(0, 100)}...`);
    }
    log('');

    // 3. Verificar N8N
    log('🔍 Verificando que N8N esté corriendo...');
    try {
      const healthCheck = await fetch('http://localhost:5678/healthz', { 
        method: 'GET',
        timeout: 3000 
      });
      log('✅ N8N está corriendo en localhost:5678');
    } catch (e) {
      log('❌ N8N no responde en localhost:5678');
      log('💡 Ejecuta: npm start en N8N o docker-compose up -d');
      return;
    }
    log('');

    // 4. Enviar a N8N
    const payload = {
      video_id: videoId,
      youtube_url: videoUrl,
      memory_id: memory.id
    };

    log('📤 Enviando a N8N para procesamiento...');
    log(`⚙️ Payload: ${JSON.stringify(payload, null, 2)}`);
    log('⏳ Esperando respuesta de AssemblyAI...');
    log('');

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 300000 // 5 minutos timeout para videos largos
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ Error N8N: ${response.status} - ${errorText}`);
      return;
    }

    // 5. Procesar respuesta de N8N
    let n8nResult;
    try {
      n8nResult = await response.json();
    } catch (e) {
      log('❌ Error parseando respuesta JSON de N8N');
      return;
    }

    if (n8nResult.status !== 'completed') {
      log(`❌ N8N Error: Status ${n8nResult.status}`);
      if (n8nResult.error) {
        log(`   Error details: ${n8nResult.error}`);
      }
      return;
    }

    log('✅ N8N procesó el video exitosamente!');
    log(`📊 Transcript length: ${n8nResult.transcript?.length || 0} caracteres`);
    log(`⏰ Timestamps: ${n8nResult.transcriptWithTimestamps?.split('\n').length || 0} segments`);
    log('');
    
    // DEBUG: Mostrar las primeras líneas para entender el formato
    log('🔍 DEBUG - Primeras 20 líneas del transcriptWithTimestamps:');
    const debugLines = n8nResult.transcriptWithTimestamps.split('\n').slice(0, 20);
    debugLines.forEach((line, i) => {
      log(`   [${i}]: "${line}"`);
    });
    log('');

    // 6. ¡AQUÍ ESTÁ LA SOLUCIÓN! Actualizar Supabase con los datos de N8N
    log('💾 ACTUALIZANDO SUPABASE con datos procesados...');
    
    // CREAR SEGMENTS ARRAY desde transcriptWithTimestamps (FORMATO CORRECTO: timestamp, texto, línea vacía)
    const segments = [];
    if (n8nResult.transcriptWithTimestamps) {
      const lines = n8nResult.transcriptWithTimestamps.split('\n');
      
      for (let i = 0; i < lines.length; i += 3) {
        const timeLine = lines[i]?.trim();
        const textLine = lines[i + 1]?.trim();
        const emptyLine = lines[i + 2]; // Should be empty
        
        // Verificar que tenemos timestamp y texto
        if (timeLine && textLine && timeLine.match(/^\d+:\d{2}$/)) {
          segments.push({
            time: timeLine,
            text: textLine,
            timestamp: timeLine
          });
        }
      }
    }
    
    log(`📊 Segments creados: ${segments.length} desde transcriptWithTimestamps`);
    
    // DEBUG: Mostrar los primeros 3 segments creados
    log('🔍 DEBUG - Primeros 3 segments creados:');
    segments.slice(0, 3).forEach((segment, i) => {
      log(`   Segment ${i + 1}:`);
      log(`     time: "${segment.time}"`);
      log(`     text: "${segment.text}"`);
      log('');
    });
    
    // Preparar metadata actualizada
    const updatedMetadata = {
      ...currentMetadata,
      youtube: {
        ...currentMetadata?.youtube,
        videoId: videoId,
        transcript: n8nResult.transcript,
        transcriptWithTimestamps: n8nResult.transcriptWithTimestamps,
        segments: segments, // ¡Ahora sí tenemos segments!
        transcriptSource: 'assemblyai',
        transcriptLanguage: n8nResult.language || 'en',
        processedAt: new Date().toISOString(),
        processedBy: 'n8n-assemblyai-script'
      }
    };

    // Actualizar en Supabase
    const { data: updateData, error: updateError } = await supabase
      .from('memories')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', memory.id)
      .select();

    if (updateError) {
      log(`❌ Error actualizando Supabase: ${updateError.message}`);
      return;
    }

    log('✅ SUPABASE ACTUALIZADO EXITOSAMENTE!');
    log('');

    // 7. Verificar que se guardó correctamente
    log('🔍 Verificando que se guardó correctamente...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('memories')
      .select('metadata')
      .eq('id', memory.id)
      .single();

    if (verifyError) {
      log(`❌ Error verificando: ${verifyError.message}`);
      return;
    }

    const savedYoutube = verifyData.metadata?.youtube || {};
    const hasNewTranscript = !!savedYoutube.transcript;
    const hasNewSegments = !!(savedYoutube.segments?.length > 0);
    const hasTimestamps = !!savedYoutube.transcriptWithTimestamps;

    log('📊 VERIFICACIÓN DE DATOS GUARDADOS:');
    log(`   ✅ Transcript guardado: ${hasNewTranscript ? 'SÍ' : 'NO'}`);
    log(`   ✅ Segments guardados: ${hasNewSegments ? 'SÍ' : 'NO'} (${savedYoutube.segments?.length || 0} segments)`);
    log(`   ✅ Timestamps guardados: ${hasTimestamps ? 'SÍ' : 'NO'}`);
    log(`   ✅ Source: ${savedYoutube.transcriptSource || 'N/A'}`);
    log(`   ✅ Procesado: ${savedYoutube.processedAt || 'N/A'}`);
    log('');

    if (hasNewTranscript && hasTimestamps) {
      log('🎉 ¡ÉXITO TOTAL! El video ha sido procesado y guardado correctamente');
      log('');
      log('📋 PREVIEW DEL RESULTADO:');
      log(`   Transcript: ${savedYoutube.transcript.substring(0, 150)}...`);
      log('');
      log('   Timestamps (primeros 3 segments):');
      const timestampLines = savedYoutube.transcriptWithTimestamps.split('\n');
      for (let i = 0; i < Math.min(6, timestampLines.length); i += 2) {
        if (timestampLines[i] && timestampLines[i+1]) {
          log(`   ${timestampLines[i]}`);
          log(`   ${timestampLines[i+1]}`);
          log('');
        }
      }
      
      log('🔍 PARA VERIFICAR EN TU WEB:');
      log('1. Ve a FoundIt.at');
      log(`2. Busca: "${memory.title}"`);
      log('3. Deberías ver timestamps perfectos clickeables!');
      
    } else {
      log('❌ Algo salió mal - datos no se guardaron correctamente');
    }

  } catch (error) {
    log(`❌ Error crítico: ${error.message}`);
    log(`Stack: ${error.stack}`);
  }
}

// Obtener URL del video desde argumentos de línea de comandos
const videoUrl = process.argv[2];

if (!videoUrl) {
  console.log('🧪 TEST: Procesar video específico + actualizar DB');
  console.log('='.repeat(50));
  console.log('');
  console.log('📋 USO:');
  console.log('   node test-single-video-with-db-update.js "https://www.youtube.com/watch?v=VIDEO_ID"');
  console.log('');
  console.log('💡 EJEMPLO:');
  console.log('   node test-single-video-with-db-update.js "https://www.youtube.com/watch?v=IXJEGjfZRBE"');
  console.log('');
  console.log('🎯 Este script:');
  console.log('   1. Busca el video en tu base de datos');
  console.log('   2. Lo envía a N8N para procesamiento');
  console.log('   3. ¡ACTUALIZA SUPABASE con los resultados!');
  console.log('   4. Verifica que se guardó correctamente');
  console.log('');
  process.exit(1);
}

// Ejecutar
console.log('🧪'.repeat(35));
console.log('🧪 TEST: VIDEO ESPECÍFICO + DB UPDATE 🧪');
console.log('🧪'.repeat(35));
console.log('');

testSingleVideoWithDbUpdate(videoUrl);