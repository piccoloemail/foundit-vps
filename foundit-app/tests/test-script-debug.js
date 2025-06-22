const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Starting debug script...');

// Configurar Supabase
const supabaseUrl = 'https://ffhspmgznqjtqhqbvznl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaHNwbWd6bnFqdHFocWJ2em5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA0NjYyNywiZXhwIjoyMDY1NjIyNjI3fQ.6JulNTjwoiQckRa_m_ZEOJvspdYc_yuey_UOtW1Lgso';

console.log('📡 Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing Supabase connection...');

async function testScript() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('memories')
      .select('id, title')
      .limit(1);
      
    if (error) {
      console.log('❌ Supabase Error:', error.message);
      return;
    }
    
    console.log('✅ Supabase connection OK');
    console.log('📊 Sample data:', data);
    
    // Test fetch function
    console.log('🌐 Testing fetch...');
    
    // Check if fetch is available
    if (typeof fetch === 'undefined') {
      console.log('❌ Fetch is not available, trying to import...');
      try {
        const fetch = require('node-fetch');
        console.log('✅ node-fetch imported successfully');
        global.fetch = fetch;
      } catch (e) {
        console.log('❌ node-fetch not available:', e.message);
        console.log('💡 Install with: npm install node-fetch');
        return;
      }
    } else {
      console.log('✅ Fetch is available');
    }
    
    // Test N8N connection
    console.log('🤖 Testing N8N connection...');
    try {
      const response = await fetch('http://localhost:5678/healthz', {
        method: 'GET'
      });
      console.log('✅ N8N is responding:', response.status);
    } catch (e) {
      console.log('❌ N8N connection failed:', e.message);
    }
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.log('❌ Critical error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testScript();