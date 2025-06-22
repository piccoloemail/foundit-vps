const { YoutubeTranscript } = require('youtube-transcript');

async function testSimpleTranscript() {
  console.log('🔍 Testing simple transcript fetch...\n');
  
  const videoId = 'Xv5ZrnzA2DA'; // From the previous test
  console.log(`🆔 Video ID: ${videoId}`);
  console.log(`🔗 URL: https://www.youtube.com/watch?v=${videoId}\n`);
  
  try {
    console.log('📺 Trying Spanish (es) without country...');
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'es'
    });
    
    if (transcript && transcript.length > 0) {
      console.log('✅ SUCCESS! Spanish transcript found');
      console.log(`   Segments: ${transcript.length}`);
      console.log(`   First segment: "${transcript[0].text}"`);
      
      // Show first 5 segments
      console.log('\n📝 First 5 segments:');
      transcript.slice(0, 5).forEach((segment, i) => {
        const minutes = Math.floor(segment.offset / 60000);
        const seconds = Math.floor((segment.offset % 60000) / 1000);
        const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        console.log(`   ${i+1}. [${timestamp}] ${segment.text}`);
      });
      
      // Check if it contains any real content
      const hasRealContent = transcript.some(s => 
        s.text.toLowerCase().includes('notebooklm') || 
        s.text.toLowerCase().includes('tutorial') ||
        s.text.toLowerCase().includes('google')
      );
      console.log(`\n🔍 Contains real content: ${hasRealContent ? '✅' : '❌'}`);
      
    } else {
      console.log('❌ No transcript found');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    
    // Try without any options
    try {
      console.log('\n📺 Trying without any language options...');
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (transcript && transcript.length > 0) {
        console.log('✅ SUCCESS! Default transcript found');
        console.log(`   Segments: ${transcript.length}`);
        console.log(`   First segment: "${transcript[0].text}"`);
        
        // Show first 3 segments
        console.log('\n📝 First 3 segments:');
        transcript.slice(0, 3).forEach((segment, i) => {
          const minutes = Math.floor(segment.offset / 60000);
          const seconds = Math.floor((segment.offset % 60000) / 1000);
          const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          console.log(`   ${i+1}. [${timestamp}] ${segment.text}`);
        });
      }
    } catch (error2) {
      console.log(`❌ Also failed without options: ${error2.message}`);
    }
  }
}

testSimpleTranscript();