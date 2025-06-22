// Test con youtube-transcript-plus
const { fetchTranscript } = require('youtube-transcript-plus');

async function testTranscriptPlus() {
  const testVideos = [
    { id: 'FLpS7OfD5-s', name: 'Why MCP really is a big deal' },
    { id: 'dQw4w9WgXcQ', name: 'Rick Roll' },
    { id: 'jNQXAC9IVRw', name: 'Me at the zoo' }
  ];
  
  for (const video of testVideos) {
    try {
      console.log(`\n🎥 Probando con youtube-transcript-plus: ${video.name}`);
      console.log(`📹 Video ID: ${video.id}`);
      console.log('🔄 Obteniendo transcripción...');
      
      // Probar con diferentes opciones
      const transcript = await fetchTranscript(video.id, {
        lang: 'en',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      
      if (transcript && transcript.length > 0) {
        console.log('✅ ¡Transcripción obtenida exitosamente!');
        console.log(`📊 Total de segmentos: ${transcript.length}`);
        
        // Mostrar los primeros 3 segmentos
        console.log('📝 Primeros segmentos:');
        transcript.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. [${item.start}s]: ${item.text}`);
        });
        
        const fullText = transcript.map(item => item.text).join(' ');
        console.log(`📄 Longitud total: ${fullText.length} caracteres`);
        console.log(`🎯 Primeras 100 caracteres: ${fullText.substring(0, 100)}...\n`);
        
        return { videoId: video.id, transcript, fullText };
      } else {
        console.log('⚠️ Transcripción vacía');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ youtube-transcript-plus tampoco funcionó');
  return null;
}

testTranscriptPlus();