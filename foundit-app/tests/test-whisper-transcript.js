// Test Whisper transcription
require('dotenv').config({ path: '.env.local' });
const { processVideo } = require('./src/utils/transcriptApi.ts');

async function testWhisperTranscript() {
  console.log('🧪 Testing Whisper transcription...');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('ENABLE_WHISPER_TRANSCRIPTION:', process.env.ENABLE_WHISPER_TRANSCRIPTION);
  
  // Test con un video corto que probablemente no tenga subtítulos
  const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll - corto para pruebas
  const testTitle = 'Test Video for Whisper';
  
  try {
    console.log('\n📹 Processing video:', testVideoId);
    const result = await processVideo(testVideoId, testTitle);
    
    console.log('\n📊 Results:');
    console.log('Success:', result.success);
    console.log('Source:', result.transcriptSource);
    console.log('Has transcript:', result.hasTranscript);
    console.log('Transcript length:', result.transcript?.length || 0);
    console.log('Segments count:', result.segments?.length || 0);
    
    if (result.transcriptSource === 'whisper_api') {
      console.log('\n✅ Whisper transcription successful!');
      console.log('First 200 chars:', result.transcript?.substring(0, 200) + '...');
    } else if (result.transcriptSource === 'youtube_api') {
      console.log('\n✅ YouTube had subtitles available (free)');
    } else if (result.transcriptSource === 'mock_testing') {
      console.log('\n⚠️ Using mock data - Whisper might have failed');
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

testWhisperTranscript();