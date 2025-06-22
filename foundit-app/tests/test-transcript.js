// Test simple de transcripción de YouTube
const { YoutubeTranscript } = require('youtube-transcript');

async function testMultipleVideos() {
  const testVideos = [
    { id: 'FLpS7OfD5-s', name: 'Why MCP really is a big deal' },
    { id: 'dQw4w9WgXcQ', name: 'Rick Roll' },
    { id: 'jNQXAC9IVRw', name: 'Me at the zoo (first YouTube video)' },
    { id: 'kJQP7kiw5Fk', name: 'Despacito' },
    { id: '9bZkp7q19f0', name: 'Gangnam Style' }
  ];
  
  for (const video of testVideos) {
    try {
      console.log(`\n🎥 Probando: ${video.name}`);
      console.log(`📹 Video ID: ${video.id}`);
      console.log('🔄 Obteniendo transcripción...');
      
      const transcript = await YoutubeTranscript.fetchTranscript(video.id);
      
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
        
        // Si encontramos uno que funciona, devolvemos este
        return { videoId: video.id, transcript, fullText };
      } else {
        console.log('⚠️ Transcripción vacía');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ No se pudo obtener transcripción de ningún video');
  return null;
}

testMultipleVideos();