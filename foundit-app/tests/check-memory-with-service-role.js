// Script para verificar memoria usando service role key
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Usar service role key
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMemoryWithServiceRole(memoryId) {
  console.log(`🔐 Checking memory with Service Role Key: ${memoryId}\n`);
  
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data) {
      console.log('✅ Memory found:');
      console.log(`   Title: ${data.title}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Updated: ${new Date(data.updated_at).toLocaleString()}`);
      
      if (data.metadata?.youtube) {
        console.log('\n📺 YouTube Metadata:');
        const youtube = data.metadata.youtube;
        console.log(`   Video ID: ${youtube.videoId || 'N/A'}`);
        console.log(`   Has Transcript: ${youtube.transcript ? '✅ Yes' : '❌ No'}`);
        
        if (youtube.transcript) {
          console.log(`   Transcript Length: ${youtube.transcript.length} chars`);
          console.log(`   Transcript Source: ${youtube.transcriptSource || 'Unknown'}`);
          console.log(`   Language: ${youtube.transcriptLanguage || 'Unknown'}`);
          
          if (youtube.aiSummary) {
            console.log('\n🧠 AI Summary:');
            console.log(`   Main Topic: ${youtube.aiSummary.mainTopic}`);
            console.log(`   Tools Mentioned: ${youtube.aiSummary.toolsMentioned?.length || 0}`);
            console.log(`   Key Concepts: ${youtube.aiSummary.keyConcepts?.length || 0}`);
            
            if (youtube.aiSummary.toolsMentioned?.length > 0) {
              console.log(`   Tools: ${youtube.aiSummary.toolsMentioned.slice(0, 5).join(', ')}${youtube.aiSummary.toolsMentioned.length > 5 ? '...' : ''}`);
            }
          }
        }
        
        console.log(`   Processed At: ${youtube.processedAt || 'Not processed'}`);
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

const memoryId = process.argv[2] || '24bb3547-4ccc-4b52-ac04-d6b3a9facf1d';
checkMemoryWithServiceRole(memoryId);