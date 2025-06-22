// Script para arreglar las políticas RLS del bucket de storage
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

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStoragePolicies() {
  console.log('🔧 Fixing Storage Policies...\n');

  try {
    // 1. Primero, vamos a eliminar las políticas existentes
    console.log('1. Removing existing policies...');
    
    // Obtener políticas existentes
    const { data: existingPolicies, error: listError } = await supabase
      .rpc('get_policies_for_table', { 
        schema_name: 'storage', 
        table_name: 'objects' 
      });
    
    if (listError) {
      console.log('   Could not list existing policies:', listError.message);
    } else {
      console.log(`   Found ${existingPolicies?.length || 0} existing policies`);
    }

    // 2. Crear nuevas políticas
    console.log('\n2. Creating new storage policies...');
    
    const policies = [
      {
        name: 'Allow authenticated users to upload their own files',
        definition: `bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]`,
        command: 'INSERT',
        check: true
      },
      {
        name: 'Allow authenticated users to view their own files',
        definition: `bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]`,
        command: 'SELECT',
        check: false
      },
      {
        name: 'Allow authenticated users to update their own files',
        definition: `bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]`,
        command: 'UPDATE',
        check: true
      },
      {
        name: 'Allow authenticated users to delete their own files',
        definition: `bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]`,
        command: 'DELETE',
        check: false
      }
    ];

    // Ejecutar SQL para crear las políticas
    for (const policy of policies) {
      const policyName = policy.name.replace(/\s+/g, '_').toLowerCase();
      
      // Primero intentar eliminar si existe
      const dropSQL = `DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`;
      
      const { error: dropError } = await supabase.rpc('exec_sql', { 
        sql: dropSQL 
      }).catch(() => ({ error: 'Not supported via RPC' }));
      
      if (dropError) {
        console.log(`   ⚠️  Could not drop policy ${policyName}`);
      }
      
      // Crear la nueva política
      const createSQL = `
        CREATE POLICY "${policyName}" ON storage.objects
        FOR ${policy.command}
        ${policy.check ? 'WITH CHECK' : 'USING'} (${policy.definition});
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createSQL 
      }).catch(() => ({ error: 'Not supported via RPC' }));
      
      if (createError) {
        console.log(`   ❌ Failed to create policy: ${policy.name}`);
        console.log(`      Error: ${createError}`);
      } else {
        console.log(`   ✅ Created policy: ${policy.name}`);
      }
    }

    // 3. Verificar el bucket
    console.log('\n3. Verifying bucket configuration...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error listing buckets:', bucketsError);
    } else {
      const memoriesBucket = buckets.find(b => b.name === 'memories');
      if (memoriesBucket) {
        console.log('   ✅ Memories bucket found');
        console.log(`      Public: ${memoriesBucket.public}`);
        console.log(`      File size limit: ${memoriesBucket.file_size_limit}`);
        console.log(`      Allowed MIME types: ${memoriesBucket.allowed_mime_types?.join(', ') || 'All'}`);
      } else {
        console.log('   ❌ Memories bucket not found!');
      }
    }

    // 4. Test con un usuario real
    console.log('\n4. Testing with real user ID...');
    const testUserId = 'e93ddb24-82ca-46fc-b8fa-b24f184c0558'; // El ID que vimos en el error
    const testPath = `${testUserId}/test-memory-${Date.now()}/test.txt`;
    
    console.log(`   Testing upload to: ${testPath}`);
    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(testPath, new Blob(['test content']), { upsert: true });
    
    if (uploadError) {
      console.error('   ❌ Upload test failed:', uploadError);
    } else {
      console.log('   ✅ Upload test succeeded!');
      
      // Cleanup
      await supabase.storage.from('memories').remove([testPath]);
      console.log('   🧹 Cleaned up test file');
    }

    console.log('\n📋 SQL to run in Supabase Dashboard:');
    console.log('------------------------------------');
    console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their files" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_users_to_upload_their_own_files" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_users_to_view_their_own_files" ON storage.objects;

-- Create new policies
CREATE POLICY "allow_authenticated_uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'memories' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "allow_authenticated_views" ON storage.objects
FOR SELECT USING (
  bucket_id = 'memories' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "allow_authenticated_updates" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'memories' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "allow_authenticated_deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'memories' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
    `);
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

fixStoragePolicies();