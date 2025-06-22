const fetch = require('node-fetch');

async function testVPSWebhook() {
  const webhookUrl = 'http://157.230.185.25:5678/webhook/youtube-transcript';
  const videoUrl = 'https://www.youtube.com/watch?v=IXJEGjfZRBE';
  
  console.log(`📡 Testing VPS N8N webhook at: ${webhookUrl}`);
  console.log(`🎥 Video URL: ${videoUrl}`);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ youtube_url: videoUrl })
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    const result = await response.json();
    console.log('✅ Response:', JSON.stringify(result, null, 2));
    console.log('📊 Response status field:', result.status);
    console.log('📝 Has transcript:', !!result.transcript);
    console.log('⏰ Has transcriptWithTimestamps:', !!result.transcriptWithTimestamps);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testVPSWebhook();