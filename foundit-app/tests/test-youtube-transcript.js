const { YoutubeTranscript } = require('youtube-transcript');

async function testTranscript() {
  console.log('🔍 Testing YouTube transcript availability...\n');
  
  // Test with a popular video that likely has captions
  const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll - should have captions
  const testUrl = 'https://www.youtube.com/watch?v=' + testVideoId;
  
  console.log(`Testing with: ${testUrl}\n`);
  
  try {
    console.log('📺 Trying English transcript...');
    const transcript = await YoutubeTranscript.fetchTranscript(testVideoId, {
      lang: 'en',
      country: 'US'
    });
    
    if (transcript && transcript.length > 0) {
      console.log('✅ SUCCESS! Transcript found');
      console.log(`   Segments: ${transcript.length}`);
      console.log(`   First segment: "${transcript[0].text}"`);
      console.log(`   Offset: ${transcript[0].offset}ms`);
      console.log(`   Duration: ${transcript[0].duration}ms`);
      
      // Show first few segments
      console.log('\n📝 First 3 segments:');
      transcript.slice(0, 3).forEach((segment, i) => {
        const minutes = Math.floor(segment.offset / 60000);
        const seconds = Math.floor((segment.offset % 60000) / 1000);
        const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        console.log(`   ${i+1}. [${timestamp}] ${segment.text}`);
      });
    } else {
      console.log('❌ No transcript found');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testTranscript();