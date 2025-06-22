const { YoutubeTranscript } = require('youtube-transcript');

async function testPopularVideo() {
  console.log('🔍 Testing with popular videos that should have captions...\n');
  
  // Test with popular tech videos that likely have captions
  const testVideos = [
    { id: 'jNQXAC9IVRw', title: 'Me at the zoo (first YouTube video)', expected: true },
    { id: 'kJQP7kiw5Fk', title: 'Despacito (Luis Fonsi)', expected: true },
    { id: '2lAe1cqCOXo', title: 'Baby Shark Dance', expected: true },
  ];
  
  for (const video of testVideos) {
    console.log(`📹 Testing: ${video.title}`);
    console.log(`🆔 Video ID: ${video.id}`);
    console.log(`🔗 URL: https://www.youtube.com/watch?v=${video.id}`);
    
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(video.id);
      
      if (transcript && transcript.length > 0) {
        console.log('✅ SUCCESS! Transcript found');
        console.log(`   Segments: ${transcript.length}`);
        console.log(`   First segment: "${transcript[0].text}"`);
        
        // Show first 3 segments with timestamps
        console.log('\n📝 First 3 segments:');
        transcript.slice(0, 3).forEach((segment, i) => {
          const minutes = Math.floor(segment.offset / 60000);
          const seconds = Math.floor((segment.offset % 60000) / 1000);
          const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          console.log(`   ${i+1}. [${timestamp}] ${segment.text}`);
        });
        
        console.log('\n🎯 This proves the YouTube transcript API is working!');
        return; // Stop after first success
        
      } else {
        console.log('❌ No transcript found');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n💡 If no transcripts were found, it might be a network/API issue.');
}

testPopularVideo();