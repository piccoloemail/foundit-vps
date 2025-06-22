// Script para probar re-procesamiento de UN solo video
require('dotenv').config({ path: '.env.local' });

// Hack para poder importar TypeScript
require('esbuild-register/dist/node').register({
  target: 'node14',
  format: 'cjs'
});

const { createClient } = require('@supabase/supabase-js');
const { processVideo } = require('./src/utils/transcriptApi.ts');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSingleVideo() {
  console.log('🧪 Probando re-procesamiento de UN video...\n');

  // Vamos a probar con el video "3 Ways to Build Beautiful Websites Using Cursor AI"
  const testVideoId = 'djDZHAi75dk';
  const testVideoTitle = '3 Ways to Build Beautiful Websites Using Cursor AI';
  
  console.log('📹 Video de prueba:');
  console.log(`   Título: ${testVideoTitle}`);
  console.log(`   URL: https://youtube.com/watch?v=${testVideoId}`);
  console.log(`   Este video menciona "Cursor" muchas veces\n`);

  // Primero, obtener el registro actual de la base de datos
  const { data: currentMemory, error: fetchError } = await supabase
    .from('memories')
    .select('*')
    .eq('url', `https://www.youtube.com/watch?v=${testVideoId}`)
    .single();

  if (fetchError || !currentMemory) {
    console.error('❌ Error obteniendo el video de la base de datos:', fetchError);
    return;
  }

  console.log('📊 Estado actual en la base de datos:');
  console.log(`   ID: ${currentMemory.id}`);
  console.log(`   Transcript source: ${currentMemory.metadata?.youtube?.transcriptSource}`);
  console.log(`   Transcript length: ${currentMemory.metadata?.youtube?.transcript?.length || 0}`);
  console.log(`   Segments: ${currentMemory.metadata?.youtube?.segments?.length || 0}`);
  
  if (currentMemory.metadata?.youtube?.segments?.[0]) {
    console.log(`   Primer segmento: "${currentMemory.metadata.youtube.segments[0].text?.substring(0, 50)}..."`);
  }

  console.log('\n⏳ Re-procesando con YouTube API...');
  
  try {
    // Procesar el video
    const result = await processVideo(testVideoId, testVideoTitle);
    
    console.log('\n📊 Resultado del procesamiento:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Source: ${result.transcriptSource}`);
    console.log(`   Language: ${result.transcriptLanguage}`);
    console.log(`   Transcript length: ${result.transcript?.length || 0}`);
    console.log(`   Segments: ${result.segments?.length || 0}`);
    
    if (result.success && result.transcriptSource !== 'mock_testing') {
      console.log('\n✅ ¡Transcript REAL obtenido!');
      
      // Mostrar los primeros 3 segmentos
      if (result.segments && result.segments.length > 0) {
        console.log('\n📝 Primeros 3 segmentos REALES:');
        result.segments.slice(0, 3).forEach((seg, i) => {
          console.log(`${i + 1}. [${seg.startTime}] "${seg.text.substring(0, 80)}..."`);
        });
      }
      
      // Buscar menciones de "cursor" en el transcript
      const cursorMatches = (result.transcript.match(/cursor/gi) || []).length;
      console.log(`\n🔍 La palabra "cursor" aparece ${cursorMatches} veces en el transcript`);
      
      // Actualizar en la base de datos
      console.log('\n💾 Actualizando base de datos...');
      
      const { error: updateError } = await supabase
        .from('memories')
        .update({
          metadata: {
            ...currentMemory.metadata,
            youtube: {
              ...currentMemory.metadata.youtube,
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
        .eq('id', currentMemory.id);

      if (updateError) {
        console.error('❌ Error actualizando la base de datos:', updateError);
      } else {
        console.log('✅ Base de datos actualizada exitosamente!');
        
        console.log('\n🎉 RESUMEN:');
        console.log('═══════════════════════════════════════════');
        console.log('✅ Transcript real obtenido de YouTube');
        console.log('✅ Reemplazó los datos mock');
        console.log('✅ La búsqueda ahora funcionará correctamente');
        console.log('✅ Timestamps precisos disponibles');
        console.log('═══════════════════════════════════════════');
        
        console.log('\n💡 Próximo paso:');
        console.log('Si todo se ve bien, puedes ejecutar:');
        console.log('node reprocess-videos-with-captions.js');
        console.log('para actualizar TODOS los videos.');
      }
      
    } else {
      console.log('\n❌ No se pudo obtener transcript real');
      console.log('Source:', result.transcriptSource);
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error durante el procesamiento:', error);
  }
}

testSingleVideo().catch(console.error);