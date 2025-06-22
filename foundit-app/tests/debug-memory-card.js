require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugMemoryCard() {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('url', 'https://www.youtube.com/watch?v=UngBxJ9uy70')
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('=== DEBUG MEMORY CARD ===');
  console.log('ID:', data.id);
  console.log('Title:', data.title);
  console.log('Type:', data.type);
  
  const metadata = JSON.parse(data.metadata);
  console.log('\n=== METADATA CHECKS ===');
  console.log('Has metadata:', !!metadata);
  console.log('Has metadata.youtube:', !!metadata.youtube);
  console.log('Has thumbnailUrl:', !!metadata.youtube?.thumbnailUrl);
  console.log('ThumbnailUrl value:', metadata.youtube?.thumbnailUrl);
  
  console.log('\n=== MEMORY CARD CONDITIONS ===');
  const isYouTube = (data.type === 'video' || data.type === 'document' || data.type === 'link') && metadata?.youtube;
  console.log('isYouTube condition:', isYouTube);
  console.log('- Type condition:', data.type === 'video' || data.type === 'document' || data.type === 'link');
  console.log('- metadata.youtube exists:', !!metadata?.youtube);
  
  const showThumbnail = isYouTube && metadata.youtube.thumbnailUrl;
  console.log('showThumbnail condition:', showThumbnail);
  
  console.log('\n=== TRANSCRIPT CHECKS ===');
  console.log('Has transcript:', !!metadata.youtube?.transcript);
  console.log('Transcript length:', metadata.youtube?.transcript?.length || 0);
  
  console.log('\n=== ACCORDION CONDITIONS ===');
  const showAccordion = isYouTube && (metadata.youtube.aiSummary || metadata.youtube.transcript);
  console.log('showAccordion condition:', showAccordion);
  console.log('- Has aiSummary:', !!metadata.youtube?.aiSummary);
  console.log('- Has transcript:', !!metadata.youtube?.transcript);
}

debugMemoryCard();