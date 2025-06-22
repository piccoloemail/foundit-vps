const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase manualmente (reemplaza con tus valores)
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5ODQ4MjAsImV4cCI6MjA0ODU2MDgyMH0.7-9UVktPGXBfN8wctfPYJbCw8jCp7NiJVxn6B3FZHpE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSegments() {
  const memoryId = '8bc5d52a-bb1b-4dba-96f0-8d510361e19b';
  
  const { data, error } = await supabase
    .from('memories')
    .select('metadata')
    .eq('id', memoryId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('🎬 Video metadata:');
  console.log('📋 Transcript length:', data.metadata?.youtube?.transcript?.length || 0);
  console.log('⏰ Segments count:', data.metadata?.youtube?.segments?.length || 0);
  
  if (data.metadata?.youtube?.segments) {
    console.log('\n🎯 First 3 segments with timestamps:');
    data.metadata.youtube.segments.slice(0, 3).forEach((segment, i) => {
      console.log(`${i + 1}. [${segment.startTime}] "${segment.text.substring(0, 50)}..."`);
      console.log(`   Offset: ${segment.offset}ms, Duration: ${segment.duration}ms`);
    });
  } else {
    console.log('❌ No segments found');
  }
}

checkSegments().catch(console.error);