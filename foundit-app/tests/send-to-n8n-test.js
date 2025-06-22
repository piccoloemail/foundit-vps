const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

// 🔧 N8N LOCAL CONFIGURADO:
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/youtube-transcript';

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
async function sendToN8NTest() {
  console.log('🔍 Buscando 1 video para enviar a N8N...\n');

  try {
    // 1. Buscar videos que necesitan timestamps
    const { data: memories, error } = await supabase
      .from('memories')
      .select('id, title, url, metadata, created_at')
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    // 2. Filtrar videos que necesitan procesamiento
    const needsProcessing = [];

    for (const memory of memories) {
      const metadata = memory.metadata;
      
      if (metadata?.youtube || metadata?.videoId || metadata?.transcript) {
        let transcript = null;
        let segments = null;
        
        if (metadata.youtube?.transcript) {
          transcript = metadata.youtube.transcript;
          segments = metadata.youtube.segments;
        } else if (metadata.transcript) {
          transcript = metadata.transcript;
          segments = metadata.segments;
        }

        // Necesita procesamiento si:
        // - Tiene transcript real (no mock)
        // - NO tiene segments útiles (oraciones completas)
        if (transcript && !isMockData(transcript)) {
          const hasUsefulSegments = segments && segments.length > 0 && 
                                  segments[0]?.text && segments[0].text.split(' ').length > 5;
          
          if (!hasUsefulSegments) {
            const videoId = extractVideoId(memory.url);
            if (videoId) {
              needsProcessing.push({
                ...memory,
                videoId,
                transcript: transcript.substring(0, 100) + '...'
              });
            }
          }
        }
      }
    }

    console.log(`📊 Videos que necesitan procesamiento: ${needsProcessing.length}\n`);

    if (needsProcessing.length === 0) {
      console.log('✅ No hay videos que necesiten procesamiento N8N!');
      return;
    }

    // 3. Mostrar videos disponibles
    console.log('🎬 Videos disponibles para procesar:');
    needsProcessing.slice(0, 5).forEach((memory, i) => {
      console.log(`   ${i+1}. ${memory.title}`);
      console.log(`      Video ID: ${memory.videoId}`);
      console.log(`      Transcript: ${memory.transcript}`);
      console.log('');
    });

    // 4. Seleccionar 1 video para testing
    const videoToProcess = needsProcessing[0];
    console.log(`🎯 Video seleccionado: "${videoToProcess.title}"`);
    console.log(`📺 URL: ${videoToProcess.url}`);
    console.log(`🆔 Memory ID: ${videoToProcess.id}`);
    console.log(`🎞️ Video ID: ${videoToProcess.videoId}`);
    console.log('');

    // 5. Verificar que N8N esté corriendo
    console.log('🔍 Verificando que N8N esté corriendo...');
    try {
      const healthCheck = await fetch('http://localhost:5678/healthz', { 
        method: 'GET',
        timeout: 3000 
      });
      console.log('✅ N8N está corriendo en localhost:5678');
    } catch (e) {
      console.log('❌ N8N no responde en localhost:5678');
      console.log('💡 Asegúrate de que N8N esté corriendo:');
      console.log('   docker-compose up -d');
      console.log('   o npm start (si instalación local)');
      console.log('');
      return;
    }

    console.log('⚙️ Configuración:');
    console.log(`   N8N URL: ${N8N_WEBHOOK_URL}`);
    console.log(`   Costo estimado: ~$0.36 por hora de video`);
    console.log(`   Tiempo estimado: 2-5 minutos dependiendo duración`);
    console.log('');

    console.log('🚀 Enviando a N8N en 3 segundos... (Ctrl+C para cancelar)\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Crear payload para N8N
    const payload = {
      video_id: videoToProcess.videoId,
      youtube_url: videoToProcess.url,
      memory_id: videoToProcess.id
    };

    console.log('📤 Enviando payload a N8N:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    // 7. Enviar a N8N
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log(`📡 Respuesta N8N: ${response.status} ${response.statusText}`);

      if (response.ok) {
        let result;
        try {
          result = await response.json();
          console.log('📋 Respuesta:', JSON.stringify(result, null, 2));
        } catch (e) {
          // N8N puede no devolver JSON
          console.log('📋 Respuesta: OK (sin JSON)');
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ VIDEO ENVIADO A N8N EXITOSAMENTE');
        console.log('='.repeat(50));
        console.log(`🎬 Video: "${videoToProcess.title}"`);
        console.log(`🆔 Memory ID: ${videoToProcess.id}`);
        console.log(`⏳ Tiempo estimado: 2-5 minutos`);
        console.log(`💰 Costo: ~$0.36 por hora`);
        console.log('');
        console.log('🔍 PARA VERIFICAR RESULTADO:');
        console.log('1. Espera 2-5 minutos (dependiendo de duración del video)');
        console.log('2. Ve a FoundIt.at y busca el título del video');
        console.log('3. Deberías ver timestamps perfectos con oraciones completas');
        console.log('4. Formato esperado: "MM:SS\\nTexto de 15 palabras..."');
        console.log('');
        console.log('📊 Si funciona bien, puedes procesar más videos modificando slice(0, 1) a slice(0, N)');

      } else {
        const errorText = await response.text();
        console.log('❌ Error N8N:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${errorText}`);
        console.log('');
        console.log('🔧 Posibles problemas:');
        console.log('- N8N no está corriendo');
        console.log('- URL del webhook incorrecta');
        console.log('- N8N no tiene configurado el endpoint');
        console.log('- Firewall bloqueando la conexión');
      }

    } catch (error) {
      console.log('❌ Error conectando con N8N:');
      console.log(`   ${error.message}`);
      console.log('');
      console.log('🔧 Posibles problemas:');
      console.log('- N8N no está corriendo');
      console.log('- URL incorrecta');
      console.log('- Sin conexión a internet');
      console.log('- CORS issues (si es localhost)');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
console.log('='.repeat(50));
console.log('🤖 ENVIAR VIDEO A N8N PARA PROCESAMIENTO');
console.log('='.repeat(50));
console.log('Este script envía 1 video a N8N para usar tu código exitoso\n');

console.log('📋 ANTES DE EJECUTAR:');
console.log('1. ✅ Asegúrate de que N8N esté corriendo');
console.log('2. ✅ Configura N8N_WEBHOOK_URL arriba con tu URL real');
console.log('3. ✅ Verifica que el workflow de N8N esté activo');
console.log('4. ✅ Confirma que tienes AssemblyAI API key en N8N');
console.log('');

sendToN8NTest();