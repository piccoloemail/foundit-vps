// Script para verificar qué videos tienen subtítulos disponibles en YouTube
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { YoutubeTranscript } = require('youtube-transcript');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVideoForCaptions(videoId, title) {
  try {
    // Intentar obtener transcript en español
    await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'es',
      country: 'ES'
    });
    return { videoId, title, hasCaptions: true, language: 'es' };
  } catch (spanishError) {
    try {
      // Si falla español, intentar inglés
      await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
        country: 'US'
      });
      return { videoId, title, hasCaptions: true, language: 'en' };
    } catch (englishError) {
      // No hay captions disponibles
      return { videoId, title, hasCaptions: false, language: null };
    }
  }
}

async function checkAllVideos() {
  console.log('🔍 Verificando qué videos tienen subtítulos disponibles en YouTube...\n');

  // Obtener todos los videos
  const { data: memories, error } = await supabase
    .from('memories')
    .select('*')
    .not('metadata->youtube', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching memories:', error);
    return;
  }

  console.log(`📊 Total de videos encontrados: ${memories.length}\n`);

  const results = {
    withCaptions: [],
    withoutCaptions: [],
    errors: []
  };

  // Verificar cada video
  for (const memory of memories) {
    const videoId = memory.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    
    if (!videoId) {
      results.errors.push({ title: memory.title, reason: 'No valid video ID found' });
      continue;
    }

    process.stdout.write(`Verificando: ${memory.title.substring(0, 50)}...`);
    
    try {
      const result = await checkVideoForCaptions(videoId, memory.title);
      
      if (result.hasCaptions) {
        process.stdout.write(` ✅ Subtítulos disponibles (${result.language})\n`);
        results.withCaptions.push(result);
      } else {
        process.stdout.write(` ❌ Sin subtítulos\n`);
        results.withoutCaptions.push(result);
      }
    } catch (error) {
      process.stdout.write(` ⚠️ Error\n`);
      results.errors.push({ title: memory.title, reason: error.message });
    }

    // Pequeña pausa para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Mostrar resumen
  console.log('\n📊 RESUMEN:');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Videos CON subtítulos: ${results.withCaptions.length}`);
  console.log(`❌ Videos SIN subtítulos: ${results.withoutCaptions.length}`);
  console.log(`⚠️  Errores: ${results.errors.length}`);
  console.log('═══════════════════════════════════════════\n');

  if (results.withCaptions.length > 0) {
    console.log('✅ VIDEOS CON SUBTÍTULOS DISPONIBLES:');
    console.log('────────────────────────────────────');
    results.withCaptions.forEach((video, i) => {
      console.log(`${i + 1}. ${video.title} (${video.language})`);
      console.log(`   https://youtube.com/watch?v=${video.videoId}`);
    });
  }

  if (results.withoutCaptions.length > 0) {
    console.log('\n❌ VIDEOS SIN SUBTÍTULOS:');
    console.log('────────────────────────────');
    results.withoutCaptions.forEach((video, i) => {
      console.log(`${i + 1}. ${video.title}`);
      console.log(`   https://youtube.com/watch?v=${video.videoId}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORES:');
    console.log('────────────');
    results.errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.title}: ${error.reason}`);
    });
  }

  // Guardar resultados en un archivo
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `caption-check-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Resultados guardados en: ${filename}`);

  // Sugerir próximos pasos
  if (results.withCaptions.length > 0) {
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Ejecuta "node reprocess-videos-with-captions.js" para re-procesar videos con subtítulos');
    console.log('2. Para videos sin subtítulos, usa el botón "Add manual transcript" en la app');
  }
}

checkAllVideos().catch(console.error);