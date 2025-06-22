// Script para verificar la última memoria creada
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

async function checkLatestMemory() {
  console.log('🔐 Checking latest memory...\n');
  
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data) {
      console.log('✅ Latest memory found:');
      console.log(`   Title: ${data.title}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Created: ${new Date(data.created_at).toLocaleString()}`);
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
          
          // Mostrar primeros 200 caracteres del transcript
          console.log(`   Transcript Preview: "${youtube.transcript.substring(0, 200)}..."`);
          
          if (youtube.aiSummary) {
            console.log('\n🧠 AI Summary:');
            console.log(`   Main Topic: ${youtube.aiSummary.mainTopic}`);
            console.log(`   Summary: ${youtube.aiSummary.summary}`);
            
            if (youtube.aiSummary.toolsMentioned?.length > 0) {
              console.log(`   Tools (${youtube.aiSummary.toolsMentioned.length}): ${youtube.aiSummary.toolsMentioned.slice(0, 10).join(', ')}${youtube.aiSummary.toolsMentioned.length > 10 ? '...' : ''}`);
            }
            
            if (youtube.aiSummary.keyConcepts?.length > 0) {
              console.log(`   Concepts (${youtube.aiSummary.keyConcepts.length}): ${youtube.aiSummary.keyConcepts.slice(0, 10).join(', ')}${youtube.aiSummary.keyConcepts.length > 10 ? '...' : ''}`);
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

checkLatestMemory();