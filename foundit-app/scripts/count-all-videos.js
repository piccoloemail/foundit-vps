const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

async function countAllMemories() {
  console.log('📊 Contando todas las memorias en la base de datos...\n');

  // Contar por tipo
  const { data: allMemories } = await supabase
    .from('memories')
    .select('type, metadata')
    .order('created_at', { ascending: false });

  if (!allMemories) {
    console.log('❌ Error obteniendo datos');
    return;
  }

  const stats = {
    total: allMemories.length,
    byType: {},
    videos: {
      total: 0,
      withYouTube: 0,
      withTranscript: 0,
      withSegments: 0,
      withMockData: 0,
      withRealData: 0
    }
  };

  // Contar por tipo
  for (const memory of allMemories) {
    const type = memory.type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Análisis detallado para videos
    if (type === 'video' || type === 'document' || type === 'link') {
      if (memory.metadata?.youtube) {
        stats.videos.total++;
        stats.videos.withYouTube++;
        
        if (memory.metadata.youtube.transcript) {
          stats.videos.withTranscript++;
          
          if (memory.metadata.youtube.segments?.length > 0) {
            stats.videos.withSegments++;
          }
          
          if (memory.metadata.youtube.transcript.includes('Welcome to this comprehensive video about')) {
            stats.videos.withMockData++;
          } else {
            stats.videos.withRealData++;
          }
        }
      } else {
        stats.videos.total++;
      }
    }
  }

  // Mostrar resultados
  console.log('📊 RESUMEN COMPLETO DE LA BASE DE DATOS');
  console.log('='.repeat(50));
  console.log(`📋 TOTAL DE MEMORIAS: ${stats.total}`);
  console.log('');
  
  console.log('📂 POR TIPO:');
  for (const [type, count] of Object.entries(stats.byType)) {
    const emoji = {
      'video': '📺',
      'note': '📝', 
      'link': '🌐',
      'document': '📄',
      'text': '📝',
      'image': '📸'
    }[type] || '❓';
    console.log(`   ${emoji} ${type}: ${count}`);
  }
  
  console.log('');
  console.log('🎬 ANÁLISIS DE VIDEOS:');
  console.log(`   📺 Total videos/documentos/links: ${stats.videos.total}`);
  console.log(`   🎥 Con metadata de YouTube: ${stats.videos.withYouTube}`);
  console.log(`   📝 Con transcript: ${stats.videos.withTranscript}`);
  console.log(`   ⏰ Con timestamps/segments: ${stats.videos.withSegments}`);
  console.log(`   🎭 Con mock data: ${stats.videos.withMockData}`);
  console.log(`   ✅ Con transcript real: ${stats.videos.withRealData}`);
  
  console.log('');
  console.log('📈 PORCENTAJES:');
  if (stats.videos.withYouTube > 0) {
    const transcriptPercent = Math.round((stats.videos.withTranscript / stats.videos.withYouTube) * 100);
    const segmentsPercent = Math.round((stats.videos.withSegments / stats.videos.withYouTube) * 100);
    const realDataPercent = Math.round((stats.videos.withRealData / stats.videos.withTranscript) * 100);
    
    console.log(`   📝 Videos con transcript: ${transcriptPercent}%`);
    console.log(`   ⏰ Videos con timestamps: ${segmentsPercent}%`);
    console.log(`   ✅ Transcripts reales: ${realDataPercent}%`);
  }
  
  console.log('='.repeat(50));
}

countAllMemories();