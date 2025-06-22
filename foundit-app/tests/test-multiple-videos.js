const { YoutubeTranscript } = require('youtube-transcript');
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMultipleVideos() {
  console.log('🔍 Testing multiple videos for transcript availability...\n');
  
  // Get several videos from database
  const { data: memories, error } = await supabase
    .from('memories')
    .select('id, title, url, metadata')
    .or('type.eq.video,type.eq.document,type.eq.link')
    .not('metadata->youtube', 'is', null)
    .limit(5);

  if (error || !memories || memories.length === 0) {
    console.error('Error getting videos:', error);
    return;
  }

  console.log(`📊 Testing ${memories.length} videos...\n`);

  for (const memory of memories) {
    console.log(`📹 ${memory.title}`);
    console.log(`🔗 ${memory.url}`);
    
    // Extract video ID
    const match = memory.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const videoId = match ? match[1] : null;
    
    if (!videoId) {
      console.log('❌ Could not extract video ID\n');
      continue;
    }
    
    console.log(`🆔 Video ID: ${videoId}`);
    
    try {
      // Try getting transcript without any options first
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (transcript && transcript.length > 0) {
        console.log('✅ SUCCESS! Transcript found');
        console.log(`   Segments: ${transcript.length}`);
        console.log(`   First segment: "${transcript[0].text}"`);
        console.log(`   Last segment: "${transcript[transcript.length - 1].text}"`);
        
        // Check if it's real content (not mock)
        const firstText = transcript[0].text.toLowerCase();
        const isReal = !firstText.includes('welcome to this comprehensive');
        console.log(`   Is real content: ${isReal ? '✅' : '❌'}`);
        
        // Check if it contains the search term "cursor"
        const containsCursor = transcript.some(s => s.text.toLowerCase().includes('cursor'));
        console.log(`   Contains 'cursor': ${containsCursor ? '✅' : '❌'}`);
        
        if (isReal) {
          console.log('\n🎯 FOUND REAL TRANSCRIPT! Testing update...');
          
          // Format segments like the app expects
          const segments = transcript.map(entry => ({
            text: entry.text.replace(/\[.*?\]/g, '').trim(),
            offset: entry.offset,
            duration: entry.duration || 2000,
            startTime: `${Math.floor(entry.offset / 60000)}:${Math.floor((entry.offset % 60000) / 1000).toString().padStart(2, '0')}`
          })).filter(segment => segment.text.length > 0);
          
          console.log(`   Formatted segments: ${segments.length}`);
          console.log(`   First formatted: [${segments[0].startTime}] ${segments[0].text}`);
          
          // Update the database
          const updatedMetadata = {
            ...memory.metadata,
            youtube: {
              ...memory.metadata.youtube,
              transcript: transcript.map(t => t.text).join(' '),
              segments: segments,
              transcriptSource: 'youtube_api',
              transcriptLanguage: 'auto'
            }
          };
          
          const { error: updateError } = await supabase
            .from('memories')
            .update({ metadata: updatedMetadata })
            .eq('id', memory.id);
          
          if (updateError) {
            console.log(`   ❌ Update error: ${updateError.message}`);
          } else {
            console.log('   ✅ Database updated with real transcript!');
          }
          
          break; // Stop after first success
        }
        
      } else {
        console.log('❌ No transcript found');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line between videos
    
    // Small delay between videos
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testMultipleVideos();