// Test N8N Local Webhook
const testWebhook = async () => {
  // ✅ URL ACTUALIZADA
  const WEBHOOK_URL = 'http://localhost:5678/webhook/youtube-transcript';
  
  console.log('🚀 Testing N8N Local Webhook...');
  
  const testData = {
    youtube_url: 'https://www.youtube.com/watch?v=xBcSLxpIlr0',
    memory_id: 'test-123',
    user_id: 'test-user',
    video_title: 'MCP Tutorial Test'
  };
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('✅ Response:', response.status);
    const data = await response.json();
    console.log('📥 Data:', data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testWebhook();