// Script para re-procesar videos que tienen subtítulos disponibles
require('dotenv').config({ path: '.env.local' });

// Hack para poder importar TypeScript
require('esbuild-register/dist/node').register({
  target: 'node14',
  format: 'cjs'
});

const { createClient } = require('@supabase/supabase-js');
const { YoutubeTranscript } = require('youtube-transcript');
const { processVideo } = require('./src/utils/transcriptApi.ts');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHasCaptions(videoId) {
  try {
    await YoutubeTranscript.fetchTranscript(videoId, { lang: 'es', country: 'ES' });
    return true;
  } catch (e1) {
    try {
      await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en', country: 'US' });
      return true;
    } catch (e2) {
      return false;
    }
  }
}

async function reprocessVideo(memory) {
  const videoId = memory.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  
  if (!videoId) {
    return { success: false, error: 'No valid video ID' };
  }

  console.log(`\n📹 Re-procesando: ${memory.title}`);
  console.log(`   ID: ${videoId}`);
  console.log(`   URL: ${memory.url}`);

  try {
    // Procesar video con la nueva lógica
    const result = await processVideo(videoId, memory.title);
    
    if (result.success && result.transcriptSource !== 'mock_testing') {
      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('memories')
        .update({
          metadata: {
            ...memory.metadata,
            youtube: {
              ...memory.metadata.youtube,
              transcript: result.transcript,
              segments: result.segments,
              transcriptLanguage: result.transcriptLanguage,
              transcriptSource: result.transcriptSource,
              aiSummary: result.aiSummary,
              hasTranscript: true,
              processedAt: result.processedAt
            }
          }
        })
        .eq('id', memory.id);

      if (updateError) {
        console.error('   ❌ Error actualizando DB:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`   ✅ Actualizado exitosamente (${result.transcriptSource})`);
      console.log(`   📝 Transcript: ${result.transcript.substring(0, 100)}...`);
      console.log(`   🎯 Segmentos: ${result.segments.length}`);
      
      return { success: true, source: result.transcriptSource };
    } else {
      console.log(`   ⚠️ No se pudo obtener transcript real`);
      return { success: false, error: 'No real transcript available' };
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function reprocessAllVideosWithCaptions() {
  console.log('🚀 Re-procesando videos con subtítulos disponibles...\n');

  // Obtener todos los videos con datos mock
  const { data: memories, error } = await supabase
    .from('memories')
    .select('*')
    .not('metadata->youtube', 'is', null)
    .eq('metadata->youtube->transcriptSource', 'mock_testing')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching memories:', error);
    return;
  }

  console.log(`📊 Videos con datos mock encontrados: ${memories.length}`);
  
  const results = {
    processed: [],
    skipped: [],
    errors: []
  };

  // Verificar y procesar cada video
  for (const memory of memories) {
    const videoId = memory.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    
    if (!videoId) {
      results.errors.push({ title: memory.title, error: 'No video ID' });
      continue;
    }

    // Verificar si tiene captions
    process.stdout.write(`Verificando captions para: ${memory.title.substring(0, 40)}... `);
    const hasCaptions = await checkHasCaptions(videoId);
    
    if (hasCaptions) {
      process.stdout.write('✅ Tiene captions\n');
      
      // Re-procesar el video
      const result = await reprocessVideo(memory);
      
      if (result.success) {
        results.processed.push({ 
          title: memory.title, 
          source: result.source 
        });
      } else {
        results.errors.push({ 
          title: memory.title, 
          error: result.error 
        });
      }
    } else {
      process.stdout.write('❌ Sin captions\n');
      results.skipped.push({ title: memory.title });
    }

    // Pausa para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Mostrar resumen
  console.log('\n\n📊 RESUMEN DE RE-PROCESAMIENTO:');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Videos procesados exitosamente: ${results.processed.length}`);
  console.log(`⏭️  Videos sin captions (saltados): ${results.skipped.length}`);
  console.log(`❌ Errores: ${results.errors.length}`);
  console.log('═══════════════════════════════════════════\n');

  if (results.processed.length > 0) {
    console.log('✅ VIDEOS PROCESADOS:');
    results.processed.forEach((video, i) => {
      console.log(`${i + 1}. ${video.title} (${video.source})`);
    });
  }

  if (results.skipped.length > 0) {
    console.log('\n⏭️  VIDEOS SIN CAPTIONS (necesitan transcript manual):');
    results.skipped.forEach((video, i) => {
      console.log(`${i + 1}. ${video.title}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORES:');
    results.errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.title}: ${error.error}`);
    });
  }

  // Guardar resultados
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `reprocess-results-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Resultados guardados en: ${filename}`);
}

// Preguntar confirmación antes de procesar
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  ADVERTENCIA: Este script re-procesará todos los videos con datos mock que tengan subtítulos disponibles.');
console.log('Esto sobrescribirá los datos mock con transcripts reales de YouTube.\n');

rl.question('¿Deseas continuar? (s/n): ', (answer) => {
  if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
    rl.close();
    reprocessAllVideosWithCaptions().catch(console.error);
  } else {
    console.log('Operación cancelada.');
    rl.close();
  }
});