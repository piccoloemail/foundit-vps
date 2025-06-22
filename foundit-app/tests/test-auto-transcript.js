// Test script para probar auto-transcripción con service role key
async function testAutoTranscript() {
  console.log('🎬 Testing auto-transcript functionality...\n');
  
  // Usar una memoria existente
  const memoryId = '24bb3547-4ccc-4b52-ac04-d6b3a9facf1d';
  const videoId = 'dQw4w9WgXcQ'; // Video ID de ejemplo
  const videoTitle = 'Test Auto Transcript Video';
  
  console.log(`📹 Memory ID: ${memoryId}`);
  console.log(`🆔 Video ID: ${videoId}`);
  console.log(`📝 Title: ${videoTitle}`);
  console.log('\n🚀 Sending request to auto-transcript endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/process-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memoryId,
        videoId,
        videoTitle
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response OK:', response.ok);
    
    const data = await response.text();
    
    try {
      const jsonData = JSON.parse(data);
      console.log('📦 Response data:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('📦 Response (text):', data);
    }
    
    if (response.ok) {
      console.log('\n✅ Auto-transcript request sent successfully!');
      console.log('⏳ Note: Video processing happens in the background');
      console.log('   Check the memory later to see if transcript was added');
    } else {
      console.error('\n❌ Auto-transcript failed');
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testAutoTranscript();