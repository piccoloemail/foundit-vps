const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listRealTranscripts() {
  console.log('🔍 Buscando videos con transcripts que NO son mock...\n');

  const { data: memories } = await supabase
    .from('memories')
    .select('id, title, url, metadata, created_at')
    .or('type.eq.video,type.eq.document,type.eq.link')
    .not('metadata->youtube->transcript', 'is', null)
    .order('created_at', { ascending: false });

  const realTranscripts = [];
  const mockTranscripts = [];

  for (const memory of memories) {
    const transcript = memory.metadata?.youtube?.transcript;
    const segments = memory.metadata?.youtube?.segments;
    
    if (!transcript) continue;
    
    const isMock = transcript.includes('Welcome to this comprehensive video about');
    const preview = transcript.substring(0, 100).replace(/\n/g, ' ');
    
    const info = {
      title: memory.title,
      created: new Date(memory.created_at).toLocaleDateString(),
      hasSegments: segments?.length > 0,
      segmentCount: segments?.length || 0,
      source: memory.metadata?.youtube?.transcriptSource || 'unknown',
      preview: preview + '...',
      url: memory.url
    };
    
    if (isMock) {
      mockTranscripts.push(info);
    } else {
      realTranscripts.push(info);
    }
  }

  console.log(`📊 Videos con transcripts REALES: ${realTranscripts.length}\n`);
  
  for (const video of realTranscripts) {
    console.log(`📹 ${video.title}`);
    console.log(`   Fecha: ${video.created}`);
    console.log(`   Segments: ${video.hasSegments ? `✅ (${video.segmentCount})` : '❌'}`);
    console.log(`   Source: ${video.source}`);
    console.log(`   Preview: "${video.preview}"`);
    console.log(`   URL: ${video.url}`);
    console.log('');
  }
  
  console.log(`\n📊 Videos con MOCK data: ${mockTranscripts.length}`);
  console.log('(Estos fueron procesados cuando YouTube no tenía transcripts disponibles)');
}

listRealTranscripts();