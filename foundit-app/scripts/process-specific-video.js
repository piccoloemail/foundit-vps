// Script para procesar un video específico manualmente
async function processSpecificVideo() {
  const memoryId = '6521744e-c211-444c-9c3e-f158e9ce6986';
  const videoId = 'YyYvpK9TWjI';
  const videoTitle = 'This AI Coder is Overpowered... and Dangerous';
  
  console.log('🎬 Processing video manually...');
  console.log(`Memory ID: ${memoryId}`);
  console.log(`Video ID: ${videoId}`);
  console.log(`Title: ${videoTitle}\n`);
  
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

    console.log('📡 Response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Video processed successfully!');
      console.log('📊 Summary:', data.summary);
    } else {
      const error = await response.text();
      console.error('❌ Error:', error);
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

processSpecificVideo();