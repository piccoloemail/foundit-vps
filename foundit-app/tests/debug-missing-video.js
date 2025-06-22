require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
console.log('🔧 Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMissingVideo() {
  const videoId = 'xBcSLxpIlr0';
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  console.log('🔍 Searching for video:', videoUrl);
  console.log('📺 Video ID:', videoId);
  
  try {
    // Search by URL
    const { data: byUrl, error: urlError } = await supabase
      .from('memories')
      .select('*')
      .eq('url', videoUrl);
    
    if (urlError) {
      console.error('❌ Error searching by URL:', urlError);
      return;
    }
    
    console.log('🔗 Found by URL:', byUrl?.length || 0, 'results');
    if (byUrl && byUrl.length > 0) {
      byUrl.forEach((memory, index) => {
        console.log(`\n📄 Memory ${index + 1}:`);
        console.log('   ID:', memory.id);
        console.log('   Title:', memory.title);
        console.log('   Type:', memory.type);
        console.log('   Created:', memory.created_at);
        console.log('   User ID:', memory.user_id);
        console.log('   Has metadata:', !!memory.metadata);
        console.log('   Has youtube data:', !!memory.metadata?.youtube);
      });
    }
    
    // Search by video ID in URL field (in case format is different)
    const { data: byVideoId, error: idError } = await supabase
      .from('memories')
      .select('*')
      .ilike('url', `%${videoId}%`);
    
    if (idError) {
      console.error('❌ Error searching by video ID:', idError);
      return;
    }
    
    console.log('\n🆔 Found by video ID pattern:', byVideoId?.length || 0, 'results');
    if (byVideoId && byVideoId.length > 0) {
      byVideoId.forEach((memory, index) => {
        console.log(`\n📄 Memory ${index + 1} (by ID search):`);
        console.log('   ID:', memory.id);
        console.log('   Title:', memory.title);
        console.log('   URL:', memory.url);
        console.log('   Type:', memory.type);
        console.log('   Created:', memory.created_at);
        console.log('   User ID:', memory.user_id);
      });
    }
    
    // Check recent memories to see if it's there but with different URL format
    const { data: recent, error: recentError } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.error('❌ Error getting recent memories:', recentError);
      return;
    }
    
    console.log('\n⏰ Recent 10 memories:');
    recent?.forEach((memory, index) => {
      console.log(`   ${index + 1}. ${memory.title} (${memory.created_at})`);
      if (memory.url && memory.url.includes('youtube')) {
        console.log(`      URL: ${memory.url}`);
      }
    });
    
    // Check if there are any memories with titles that might match
    const { data: byTitle, error: titleError } = await supabase
      .from('memories')
      .select('*')
      .ilike('title', '%claude%')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (titleError) {
      console.error('❌ Error searching by title:', titleError);
      return;
    }
    
    console.log('\n📝 Recent memories with "claude" in title:');
    byTitle?.forEach((memory, index) => {
      console.log(`   ${index + 1}. ${memory.title}`);
      console.log(`      URL: ${memory.url}`);
      console.log(`      Created: ${memory.created_at}`);
      console.log(`      User: ${memory.user_id}`);
    });
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugMissingVideo().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script error:', error);
  process.exit(1);
});