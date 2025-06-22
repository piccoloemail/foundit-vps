// Test script para verificar que el endpoint de transcript manual funciona

async function testManualTranscriptEndpoint() {
  console.log('🧪 Testing manual transcript endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/process-manual-transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memoryId: 'test-memory-id',
        transcript: 'This is a test transcript for a video about React hooks.',
        videoTitle: 'Test Video Title'
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response OK:', response.ok);
    
    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Endpoint returned error:', data.error);
    } else {
      console.log('✅ Endpoint is working!');
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
    console.log('\n⚠️  Make sure the Next.js server is running (npm run dev)');
    console.log('⚠️  The endpoint might need a server restart to be detected');
  }
}

testManualTranscriptEndpoint();