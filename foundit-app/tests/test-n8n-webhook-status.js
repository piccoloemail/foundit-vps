const fetch = require('node-fetch');

async function testN8NWebhook() {
  console.log('Testing N8N webhook status...\n');
  
  // Test both test and production webhook URLs
  const urls = [
    {
      name: 'Test Webhook',
      url: 'http://localhost:5678/webhook-test/youtube-transcript'
    },
    {
      name: 'Production Webhook',
      url: 'http://localhost:5678/webhook/youtube-transcript'
    }
  ];
  
  for (const webhook of urls) {
    console.log(`\nTesting ${webhook.name}:`);
    console.log(`URL: ${webhook.url}`);
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          youtube_url: 'https://www.youtube.com/watch?v=test123',
          memory_id: 'test-memory-id'
        })
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        const error = await response.json();
        console.log('Error:', error.message);
        if (error.hint) {
          console.log('Hint:', error.hint);
        }
      } else {
        console.log('✅ Webhook is accessible!');
      }
    } catch (error) {
      console.log(`❌ Connection error: ${error.message}`);
    }
  }
  
  console.log('\n\nIMPORTANT: Make sure your workflow is ACTIVE in N8N!');
  console.log('Look for the toggle switch in the top-right corner of the N8N editor.');
}

testN8NWebhook();