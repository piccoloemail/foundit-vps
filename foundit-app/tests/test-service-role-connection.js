// Test script para verificar que la service role key funciona
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

async function testServiceRoleConnection() {
  console.log('🔑 Testing Service Role Key connection...\n');
  
  // Cliente normal (anon key)
  const supabaseAnon = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  // Cliente con service role
  const supabaseService = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    console.log('📊 Testing with ANON key:');
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('memories')
      .select('id, title')
      .limit(5);
      
    console.log(`   Results: ${anonData?.length || 0} memories`);
    if (anonError) console.log(`   Error: ${anonError.message}`);
    
    console.log('\n🔐 Testing with SERVICE ROLE key:');
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('memories')
      .select('id, title')
      .limit(5);
      
    console.log(`   Results: ${serviceData?.length || 0} memories`);
    if (serviceError) console.log(`   Error: ${serviceError.message}`);
    
    if (serviceData && serviceData.length > 0) {
      console.log('\n✅ Service Role Key is working! Found memories:');
      serviceData.forEach((mem, i) => {
        console.log(`   ${i+1}. ${mem.title} (${mem.id})`);
      });
    } else if (!serviceError) {
      console.log('\n✅ Service Role Key connection OK, but no memories found');
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
  }
}

testServiceRoleConnection();