require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkVideo() {
  const { data, error } = await supabase
    .from('memories')
    .select('metadata')
    .eq('url', 'https://www.youtube.com/watch?v=UngBxJ9uy70')
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const metadata = JSON.parse(data.metadata);
  
  console.log('=== METADATA STRUCTURE ===');
  console.log('Has youtube object:', !!metadata.youtube);
  console.log('Has transcript:', !!metadata.youtube?.transcript);
  console.log('Transcript length:', metadata.youtube?.transcript?.length || 0);
  console.log('Transcript source:', metadata.youtube?.transcriptSource);
  console.log('Transcript preview:', metadata.youtube?.transcript?.substring(0, 100) + '...' || 'NULL');
  console.log('Has segments:', !!metadata.youtube?.segments);
}

checkVideo();