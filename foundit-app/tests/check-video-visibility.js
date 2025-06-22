require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVideoVisibility() {
  const targetVideoId = '2e9ae628-647c-405f-9cf2-e6722a3de2c3';
  
  try {
    // Check if the specific video exists
    const { data: specificVideo, error: videoError } = await supabase
      .from('memories')
      .select('*')
      .eq('id', targetVideoId)
      .single();
    
    if (videoError) {
      console.error('❌ Error finding specific video:', videoError);
      return;
    }
    
    console.log('📺 Target Video Details:');
    console.log('   ID:', specificVideo.id);
    console.log('   Title:', specificVideo.title);
    console.log('   URL:', specificVideo.url);
    console.log('   Type:', specificVideo.type);
    console.log('   Category:', specificVideo.category);
    console.log('   Tags:', specificVideo.tags);
    console.log('   Created:', specificVideo.created_at);
    console.log('   Updated:', specificVideo.updated_at);
    console.log('   User ID:', specificVideo.user_id);
    console.log('   Has Metadata:', !!specificVideo.metadata);
    console.log('   Has YouTube Metadata:', !!specificVideo.metadata?.youtube);
    
    if (specificVideo.metadata?.youtube) {
      console.log('\n🎬 YouTube Metadata:');
      console.log('   Channel:', specificVideo.metadata.youtube.channelTitle);
      console.log('   Duration:', specificVideo.metadata.youtube.duration);
      console.log('   View Count:', specificVideo.metadata.youtube.viewCount);
      console.log('   Has Transcript:', !!specificVideo.metadata.youtube.transcript);
      console.log('   Transcript Source:', specificVideo.metadata.youtube.transcriptSource);
      console.log('   Has AI Summary:', !!specificVideo.metadata.youtube.aiSummary);
    }
    
    // Check total count of memories for this user
    const { count: totalCount, error: countError } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', specificVideo.user_id);
    
    if (countError) {
      console.error('❌ Error getting count:', countError);
    } else {
      console.log('\n📊 Total memories for user:', totalCount);
    }
    
    // Check recent memories to see position
    const { data: recentMemories, error: recentError } = await supabase
      .from('memories')
      .select('id, title, created_at')
      .eq('user_id', specificVideo.user_id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (recentError) {
      console.error('❌ Error getting recent memories:', recentError);
    } else {
      console.log('\n⏰ Position in recent memories:');
      const position = recentMemories.findIndex(m => m.id === targetVideoId);
      if (position >= 0) {
        console.log(`   Found at position: ${position + 1} (should be visible)`);
      } else {
        console.log('   ❌ Not found in recent 20 memories!');
      }
      
      recentMemories.forEach((memory, index) => {
        const marker = memory.id === targetVideoId ? ' ← TARGET VIDEO' : '';
        console.log(`   ${index + 1}. ${memory.title.substring(0, 50)}...${marker}`);
      });
    }
    
    // Check if there are any RLS issues
    console.log('\n🔒 RLS Check:');
    console.log('   Video User ID:', specificVideo.user_id);
    console.log('   This should match your auth user ID when logged in');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkVideoVisibility().then(() => {
  console.log('\n✅ Visibility check completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script error:', error);
  process.exit(1);
});