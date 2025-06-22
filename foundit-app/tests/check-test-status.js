require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('id, title, url, content')
      .not('url', 'is', null)
      .like('url', '%youtube.com%')
      .order('created_at', { ascending: true })
      .limit(5);
    
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    console.log('📊 STATUS DE LOS 5 VIDEOS DE PRUEBA:');
    console.log('==================================================');
    data.forEach((video, i) => {
      const hasRealTranscript = video.content && 
        video.content.length > 100 && 
        !video.content.includes('No transcript available');
      const status = hasRealTranscript ? '✅ PROCESADO' : '❌ PENDIENTE';
      const length = video.content ? video.content.length : 0;
      console.log(`${i+1}. ${status} ${video.title}`);
      console.log(`   Transcript length: ${length} chars`);
      console.log(`   URL: ${video.url}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStatus();