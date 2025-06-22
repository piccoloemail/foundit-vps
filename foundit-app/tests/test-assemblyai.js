// Test con AssemblyAI (más confiable)
const { AssemblyAI } = require('assemblyai');
const ytdl = require('ytdl-core');

async function testAssemblyAI() {
  try {
    console.log('🎥 Probando transcripción con AssemblyAI...\n');
    
    // NOTA: Necesitas registrarte en AssemblyAI y obtener tu API key
    // Visita: https://www.assemblyai.com/
    // Registra tu API key en .env.local como: ASSEMBLYAI_API_KEY=tu_api_key
    
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      console.log('❌ Necesitas configurar ASSEMBLYAI_API_KEY en .env.local');
      console.log('📝 Pasos:');
      console.log('1. Ve a https://www.assemblyai.com/');
      console.log('2. Crea una cuenta gratuita');
      console.log('3. Obtén tu API key');
      console.log('4. Agrega ASSEMBLYAI_API_KEY=tu_api_key a .env.local');
      return null;
    }
    
    const client = new AssemblyAI({ apiKey });
    
    // Video de prueba
    const videoId = 'FLpS7OfD5-s'; // Why MCP really is a big deal
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`📹 Video: ${videoUrl}`);
    console.log('🔄 Obteniendo URL del audio...');
    
    // Obtener la URL del audio del video
    const info = await ytdl.getInfo(videoUrl);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (audioFormats.length === 0) {
      console.log('❌ No se encontraron formatos de audio');
      return null;
    }
    
    const audioUrl = audioFormats[0].url;
    console.log('✅ URL del audio obtenida');
    console.log('🤖 Enviando a AssemblyAI para transcripción...');
    
    // Transcribir con AssemblyAI
    const transcript = await client.transcripts.transcribe({
      audio: audioUrl,
      language_code: 'en' // Cambiar a 'es' para español
    });
    
    if (transcript.status === 'completed') {
      console.log('✅ ¡Transcripción completada exitosamente!');
      console.log(`📊 Precisión: ${transcript.confidence}%`);
      console.log(`📄 Longitud: ${transcript.text.length} caracteres`);
      console.log(`🎯 Primeras 200 caracteres:`);
      console.log(transcript.text.substring(0, 200) + '...\n');
      
      return {
        videoId,
        transcript: transcript.text,
        confidence: transcript.confidence,
        words: transcript.words
      };
    } else {
      console.log(`❌ Error en transcripción: ${transcript.status}`);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Verificar si tenemos la API key
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  process.env.ASSEMBLYAI_API_KEY = envVars.ASSEMBLYAI_API_KEY;
} catch (error) {
  console.log('⚠️ No se pudo leer .env.local');
}

testAssemblyAI();