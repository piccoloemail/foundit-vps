// Debug script para verificar autenticación y storage
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

console.log('🔑 Environment Variables:');
console.log('SUPABASE_URL:', envVars.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('ANON_KEY:', envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('SERVICE_ROLE_KEY:', envVars.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

// Test con anon key (cliente)
const supabaseClient = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test con service role (admin)
const supabaseAdmin = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function debugStorage() {
  console.log('\n🗂️  Testing Storage Access...\n');

  try {
    // 1. Test bucket listing con service role
    console.log('1. Listing buckets (Service Role):');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Error:', bucketsError);
    } else {
      console.log('✅ Buckets found:', buckets.map(b => `${b.name} (public: ${b.public})`));
    }

    // 2. Test bucket policies
    console.log('\n2. Checking bucket policies:');
    try {
      const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('get_bucket_policies', { bucket_name: 'memories' });
      
      if (policiesError) {
        console.log('⚠️  Cannot fetch policies directly via RPC');
      } else {
        console.log('📋 Policies:', policies);
      }
    } catch (e) {
      console.log('⚠️  Policy check not available via RPC');
    }

    // 3. Test con usuario fake (para ver RLS)
    console.log('\n3. Testing with fake user ID:');
    const fakeUserId = 'test-user-123';
    const testPath = `${fakeUserId}/test-memory/test.txt`;
    
    // Intentar upload con service role (debería funcionar)
    console.log('   Testing upload with service role...');
    const { error: uploadError } = await supabaseAdmin.storage
      .from('memories')
      .upload(testPath, new Blob(['test content']), { upsert: true });
    
    if (uploadError) {
      console.error('   ❌ Service role upload failed:', uploadError);
    } else {
      console.log('   ✅ Service role upload succeeded');
      
      // Cleanup
      await supabaseAdmin.storage.from('memories').remove([testPath]);
      console.log('   🧹 Cleaned up test file');
    }

    // 4. Test estructura esperada
    console.log('\n4. Expected folder structure:');
    console.log('   memories/');
    console.log('     └── {user_id}/');
    console.log('         └── {memory_id}/');
    console.log('             └── file.ext');
    
    console.log('\n5. Current error analysis:');
    console.log('   - Error 403: Políticas RLS están activas pero restrictivas');
    console.log('   - "new row violates row-level security policy"');
    console.log('   - Usuario ID undefined: problema de autenticación en frontend');

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

debugStorage();