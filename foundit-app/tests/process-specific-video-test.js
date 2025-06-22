const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

// N8N Local configurado
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/youtube-transcript';

// VIDEO ESPECÍFICO A PROCESAR
const SPECIFIC_VIDEO_URL = 'https://www.youtube.com/watch?v=IXJEGjfZRBE';

// Extraer video ID de URL
function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

// Función principal
async function processSpecificVideo() {
  console.log('🎯 PROCESANDO VIDEO ESPECÍFICO');
  console.log('='.repeat(50));
  console.log(`📺 URL: ${SPECIFIC_VIDEO_URL}`);
  
  const videoId = extractVideoId(SPECIFIC_VIDEO_URL);
  console.log(`🆔 Video ID: ${videoId}`);
  console.log('');

  try {
    // 1. Buscar si el video ya existe en la base de datos
    console.log('🔍 Buscando video en base de datos...');
    
    const { data: memories, error } = await supabase
      .from('memories')
      .select('id, title, url, metadata')
      .eq('url', SPECIFIC_VIDEO_URL)
      .limit(1);

    if (error) {
      console.error('❌ Error buscando en DB:', error);
      return;
    }

    if (!memories || memories.length === 0) {
      console.log('❌ Video NO encontrado en la base de datos');
      console.log('💡 Primero debes guardar el video en FoundIt.at');
      return;
    }

    const memory = memories[0];
    console.log('✅ Video encontrado en base de datos:');
    console.log(`   Título: ${memory.title}`);
    console.log(`   Memory ID: ${memory.id}`);
    console.log('');

    // 2. Verificar estado actual
    const hasTranscript = memory.metadata?.youtube?.transcript || memory.metadata?.transcript;
    const hasSegments = memory.metadata?.youtube?.segments?.length > 0 || memory.metadata?.segments?.length > 0;
    
    console.log('📊 Estado actual:');
    console.log(`   Transcript: ${hasTranscript ? 'SÍ' : 'NO'}`);
    console.log(`   Segments: ${hasSegments ? 'SÍ' : 'NO'}`);
    console.log('');

    // 3. Preparar payload para N8N
    const payload = {
      video_id: videoId,
      youtube_url: SPECIFIC_VIDEO_URL,
      memory_id: memory.id
    };

    console.log('📤 Enviando a N8N para procesamiento...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    // 4. Enviar a N8N
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
        console.log('✅ N8N procesó exitosamente:');
        console.log(`   Status: ${result.status}`);
        console.log(`   Transcript: ${result.transcript ? result.transcript.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`   Segments: ${result.transcriptWithTimestamps ? result.transcriptWithTimestamps.split('\n').length + ' líneas' : 'N/A'}`);
        console.log('');
        console.log('🎉 VIDEO PROCESADO EXITOSAMENTE');
        console.log('');
        console.log('🔍 PRÓXIMOS PASOS:');
        console.log('1. Espera 2-3 minutos para que se actualice la DB');
        console.log('2. Ve a FoundIt.at y busca el video');
        console.log('3. Verifica que aparezcan los timestamps clickeables');
      } catch (e) {
        console.log('✅ N8N respondió OK (sin JSON detallado)');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error de N8N:');
      console.log(errorText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar
console.log('='.repeat(50));
console.log('🎬 PROCESAR VIDEO ESPECÍFICO CON N8N');
console.log('='.repeat(50));
console.log('');

processSpecificVideo();