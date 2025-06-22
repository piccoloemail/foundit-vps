// Test AssemblyAI transcription
require('dotenv').config({ path: '.env.local' });

// Hack para poder importar TypeScript
require('esbuild-register/dist/node').register({
  target: 'node14',
  format: 'cjs'
});

const { processVideo } = require('./src/utils/transcriptApi.ts');

async function testAssemblyAI() {
  console.log('🧪 Testing AssemblyAI transcription...');
  console.log('ASSEMBLYAI_API_KEY:', process.env.ASSEMBLYAI_API_KEY ? '✅ Configured' : '❌ Missing');
  
  // Test con un video corto sobre Cursor
  const testVideoId = 'gDlfui8i8mE'; // Un video corto sobre Cursor/Claude
  const testTitle = 'Test Video for AssemblyAI';
  
  try {
    console.log('\n📹 Processing video:', testVideoId);
    console.log('🔗 URL: https://www.youtube.com/watch?v=' + testVideoId);
    
    const result = await processVideo(testVideoId, testTitle);
    
    console.log('\n📊 Results:');
    console.log('Success:', result.success);
    console.log('Source:', result.transcriptSource);
    console.log('Language:', result.transcriptLanguage);
    console.log('Has transcript:', result.hasTranscript);
    console.log('Transcript length:', result.transcript?.length || 0);
    console.log('Segments count:', result.segments?.length || 0);
    
    if (result.transcriptSource === 'assemblyai') {
      console.log('\n✅ AssemblyAI transcription successful!');
      console.log('First 300 chars:', result.transcript?.substring(0, 300) + '...');
      
      if (result.segments && result.segments.length > 0) {
        console.log('\n📍 First 3 segments:');
        result.segments.slice(0, 3).forEach((seg, i) => {
          console.log(`${i + 1}. [${seg.startTime}] ${seg.text.substring(0, 60)}...`);
        });
      }
    } else if (result.transcriptSource === 'youtube_api') {
      console.log('\n✅ YouTube had subtitles available (free)');
    } else if (result.transcriptSource === 'mock_testing') {
      console.log('\n⚠️ Using mock data - AssemblyAI might have failed');
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
    
    if (result.aiSummary) {
      console.log('\n🧠 AI Summary:');
      console.log('Topic:', result.aiSummary.mainTopic);
      console.log('Tools:', result.aiSummary.toolsMentioned?.slice(0, 5).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAssemblyAI();