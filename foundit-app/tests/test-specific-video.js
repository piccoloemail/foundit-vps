const { YoutubeTranscript } = require('youtube-transcript');
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpecificVideo() {
  console.log('🔍 Testing transcript for a specific video from database...\n');
  
  // Get one video from database
  const { data: memories, error } = await supabase
    .from('memories')
    .select('id, title, url, metadata')
    .or('type.eq.video,type.eq.document,type.eq.link')
    .not('metadata->youtube', 'is', null)
    .limit(1);

  if (error || !memories || memories.length === 0) {
    console.error('Error getting video:', error);
    return;
  }

  const memory = memories[0];
  console.log(`📹 Testing: ${memory.title}`);
  console.log(`🔗 URL: ${memory.url}`);
  
  // Extract video ID
  const match = memory.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  const videoId = match ? match[1] : null;
  
  if (!videoId) {
    console.log('❌ Could not extract video ID');
    return;
  }
  
  console.log(`🆔 Video ID: ${videoId}\n`);
  
  // Test different language approaches
  const langOptions = [
    { lang: 'en', country: 'US', name: 'English (US)' },
    { lang: 'en', country: 'GB', name: 'English (UK)' },
    { lang: 'es', country: 'ES', name: 'Spanish (ES)' },
    { lang: 'es', country: 'MX', name: 'Spanish (MX)' },
  ];
  
  for (const option of langOptions) {
    try {
      console.log(`📺 Trying ${option.name}...`);
      
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: option.lang,
        country: option.country
      });
      
      if (transcript && transcript.length > 0) {
        console.log('✅ SUCCESS! Transcript found');
        console.log(`   Language: ${option.name}`);
        console.log(`   Segments: ${transcript.length}`);
        console.log(`   First segment: "${transcript[0].text}"`);
        console.log(`   Contains 'cursor': ${transcript.some(s => s.text.toLowerCase().includes('cursor'))}`);
        
        // Show first few segments
        console.log('\n📝 First 3 segments:');
        transcript.slice(0, 3).forEach((segment, i) => {
          const minutes = Math.floor(segment.offset / 60000);
          const seconds = Math.floor((segment.offset % 60000) / 1000);
          const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          console.log(`   ${i+1}. [${timestamp}] ${segment.text}`);
        });
        
        return; // Found transcript, stop trying other languages
      } else {
        console.log('   ❌ No transcript found');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n❌ No transcript found in any language');
}

testSpecificVideo();