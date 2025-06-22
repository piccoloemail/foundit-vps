const { YoutubeTranscript } = require('youtube-transcript');

// Probar con el video de Cursor que sabemos que tiene transcript
const videoId = 'djDZHAi75dk'; // 3 Ways to Build Beautiful Websites Using Cursor AI

async function testVideo() {
  console.log(`🔍 Probando video ID: ${videoId}`);
  
  try {
    // Intentar obtener transcript sin especificar idioma
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (transcript && transcript.length > 0) {
      console.log(`✅ Transcript encontrado!`);
      console.log(`📊 Total segmentos: ${transcript.length}`);
      console.log(`\n🎯 Primeros 3 segmentos:`);
      
      transcript.slice(0, 3).forEach((segment, i) => {
        console.log(`\n${i + 1}. Tiempo: ${segment.offset}ms`);
        console.log(`   Texto: "${segment.text}"`);
        console.log(`   Duración: ${segment.duration}ms`);
      });
    } else {
      console.log('❌ No se encontró transcript');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Intentar listar idiomas disponibles
    try {
      console.log('\n🌍 Intentando listar idiomas disponibles...');
      const list = await YoutubeTranscript.listTranscripts(videoId);
      console.log('Idiomas:', list);
    } catch (e) {
      console.log('No se pudo listar idiomas');
    }
  }
}

testVideo();