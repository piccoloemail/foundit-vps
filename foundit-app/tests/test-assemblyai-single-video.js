const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

// AssemblyAI API Key (necesitas configurar esto)
const ASSEMBLYAI_API_KEY = 'TU_ASSEMBLYAI_API_KEY_AQUI';

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

// TU CÓDIGO N8N CONVERTIDO - Formatear transcript con timestamps
function formatTranscriptWithTimestamps(assemblyAIResponse) {
  const words = assemblyAIResponse.words || [];
  const fullTranscript = assemblyAIResponse.text || '';

  let transcriptWithTimestamps = '';

  if (words.length > 0) {
    let currentSegment = '';
    let wordsInSegment = 0;
    const WORDS_PER_SEGMENT = 15;
    
    words.forEach((word, index) => {
      if (wordsInSegment === 0) {
        if (currentSegment) {
          transcriptWithTimestamps += currentSegment.trim() + '\n\n';
        }
        
        // CORRECCIÓN: AssemblyAI devuelve milisegundos, convertir a segundos
        const timeInSeconds = word.start / 1000;
        
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        transcriptWithTimestamps += `${minutes}:${seconds.toString().padStart(2, '0')}\n`;
        currentSegment = '';
      }
      
      currentSegment += word.text + ' ';
      wordsInSegment++;
      
      const shouldEndSegment = 
        wordsInSegment >= WORDS_PER_SEGMENT ||
        (word.text.match(/[.!?]$/) && wordsInSegment >= 8) ||
        index === words.length - 1;
      
      if (shouldEndSegment) {
        wordsInSegment = 0;
      }
    });
    
    if (currentSegment.trim()) {
      transcriptWithTimestamps += currentSegment.trim();
    }
  } else {
    transcriptWithTimestamps = fullTranscript;
  }

  return {
    transcript: fullTranscript,
    transcriptWithTimestamps: transcriptWithTimestamps.trim()
  };
}

// Función para transcribir con AssemblyAI
async function transcribeWithAssemblyAI(audioUrl) {
  console.log('   🎙️ Iniciando transcripción con AssemblyAI...');
  
  try {
    // 1. Enviar para transcripción
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        word_timestamps: true,
        punctuate: true,
        format_text: true
      })
    });

    const transcriptData = await transcriptResponse.json();
    
    if (!transcriptResponse.ok) {
      throw new Error(`AssemblyAI error: ${transcriptData.error}`);
    }

    const transcriptId = transcriptData.id;
    console.log(`   📝 Transcript ID: ${transcriptId}`);
    console.log('   ⏳ Esperando transcripción... (esto puede tomar varios minutos)');

    // 2. Polling para esperar resultado
    let result;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutos máximo

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY
        }
      });

      result = await statusResponse.json();
      
      console.log(`   📊 Estado: ${result.status} (intento ${attempts + 1}/${maxAttempts})`);
      
      if (result.status === 'completed') {
        console.log('   ✅ Transcripción completada!');
        return result;
      } else if (result.status === 'error') {
        throw new Error(`Transcripción falló: ${result.error}`);
      }
      
      attempts++;
    }
    
    throw new Error('Timeout esperando transcripción');

  } catch (error) {
    console.error(`   ❌ Error AssemblyAI: ${error.message}`);
    throw error;
  }
}

// Función principal
async function testAssemblyAISingleVideo() {
  console.log('🔍 Buscando 1 video para probar AssemblyAI...\n');

  try {
    // 1. Buscar videos que necesitan procesamiento
    const { data: memories, error } = await supabase
      .from('memories')
      .select('id, title, url, metadata, created_at')
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    // 2. Filtrar videos que necesitan timestamps
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

        if (transcript && !isMockData(transcript)) {
          const hasUsefulSegments = segments && segments.length > 0 && 
                                  segments[0]?.text && segments[0].text.split(' ').length > 5;
          
          if (!hasUsefulSegments) {
            const videoId = extractVideoId(memory.url);
            if (videoId) {
              needsProcessing.push({
                ...memory,
                videoId,
                transcript
              });
            }
          }
        }
      }
    }

    console.log(`📊 Videos que necesitan procesamiento: ${needsProcessing.length}\n`);

    if (needsProcessing.length === 0) {
      console.log('✅ No hay videos que necesiten procesamiento!');
      return;
    }

    // 3. Seleccionar 1 video para testing
    const videoToProcess = needsProcessing[0];
    console.log('🎬 Video seleccionado para testing:');
    console.log(`   Título: ${videoToProcess.title}`);
    console.log(`   Video ID: ${videoToProcess.videoId}`);
    console.log(`   URL: ${videoToProcess.url}`);
    console.log('');

    console.log('⚠️  IMPORTANTE:');
    console.log('- Este proceso puede tomar 5-10 minutos dependiendo de la duración del video');
    console.log('- Costo estimado: ~$0.36 por hora de video');
    console.log('- El resultado tendrá el formato perfecto con timestamps');
    console.log('');
    console.log('Iniciando en 5 segundos... (Ctrl+C para cancelar)\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. NOTA: Para usar AssemblyAI necesitamos la URL del audio
    // Normalmente N8N extrae el audio, aquí necesitamos simular eso
    console.log('❌ NOTA: Para completar este test necesitamos:');
    console.log('1. Extraer audio del video YouTube (requiere yt-dlp o similar)');
    console.log('2. Subir audio a un URL público temporal');
    console.log('3. Enviar esa URL a AssemblyAI');
    console.log('');
    console.log('💡 ALTERNATIVA MÁS RÁPIDA:');
    console.log('- Usar N8N que ya tiene esta lógica funcionando');
    console.log('- O probar con un archivo de audio que ya tengas público');
    console.log('');
    console.log('🎯 PARA TESTING INMEDIATO:');
    console.log('Si tienes una URL de audio público, edita este script y ponla en audioUrl');

    // PARA TESTING: descomenta y pon una URL de audio real
    // const audioUrl = 'https://example.com/audio.mp3';
    // const assemblyResult = await transcribeWithAssemblyAI(audioUrl);
    // const formatted = formatTranscriptWithTimestamps(assemblyResult);
    // console.log('✅ Resultado:', formatted);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
console.log('='.repeat(50));
console.log('🎙️ TEST ASSEMBLYAI - SINGLE VIDEO');
console.log('='.repeat(50));
console.log('Script standalone usando tu código N8N perfecto\n');

console.log('📋 PASOS PARA TESTING COMPLETO:');
console.log('1. Configura ASSEMBLYAI_API_KEY arriba');
console.log('2. Instala yt-dlp para extraer audio (opcional)');
console.log('3. O usa N8N que ya tiene todo configurado');
console.log('');

testAssemblyAISingleVideo();