const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTranscripts() {
  console.log('🔍 Analizando transcripts en la base de datos...\n');

  const { data: memories, error } = await supabase
    .from('memories')
    .select('id, title, metadata')
    .or('type.eq.video,type.eq.document,type.eq.link')
    .not('metadata->youtube->transcript', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`📊 Analizando ${memories.length} videos con transcript...\n`);

  for (const memory of memories) {
    console.log(`📹 ${memory.title}`);
    
    const youtube = memory.metadata?.youtube;
    if (youtube) {
      console.log(`   - Fuente: ${youtube.transcriptSource || 'desconocido'}`);
      console.log(`   - Tiene segments: ${youtube.segments?.length > 0 ? `✅ (${youtube.segments.length} segmentos)` : '❌'}`);
      console.log(`   - Longitud transcript: ${youtube.transcript?.length || 0} caracteres`);
      
      if (youtube.segments?.length > 0) {
        console.log(`   - Primer timestamp: ${youtube.segments[0].startTime || 'sin formato'}`);
      }
      
      // Detectar si es mock data
      if (youtube.transcript?.includes('Welcome to this comprehensive video about')) {
        console.log(`   ⚠️  MOCK DATA DETECTADO`);
      }
    }
    console.log('');
  }
}

checkTranscripts();