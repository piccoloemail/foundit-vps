// Test N8N Webhook Connection
// Reemplaza TU_WEBHOOK_URL con la URL que te dio N8N

async function testN8NWebhook() {
  // ⚠️ CAMBIA ESTA URL POR LA TUYA
  const WEBHOOK_URL = 'https://TU-WORKSPACE.app.n8n.cloud/webhook-test/test-transcript';
  
  console.log('🚀 Testing N8N Webhook...');
  console.log('📍 URL:', WEBHOOK_URL);
  
  const testData = {
    youtube_url: 'https://www.youtube.com/watch?v=xBcSLxpIlr0',
    memory_id: 'test-memory-123',
    video_title: 'Test Video for N8N',
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log('\n📤 Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Status Text:', response.statusText);
    
    const responseData = await response.text();
    console.log('📥 Response Data:', responseData);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! N8N Webhook is working!');
      console.log('🎉 You can now see the data in N8N editor');
    } else {
      console.log('\n❌ Error: Webhook returned error status');
    }
    
  } catch (error) {
    console.error('\n💥 Error calling webhook:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Make sure you clicked "Listen for Test Event" in N8N');
    console.log('2. Check that the URL is correct');
    console.log('3. Make sure N8N tab is still open');
  }
}

// Run the test
testN8NWebhook();