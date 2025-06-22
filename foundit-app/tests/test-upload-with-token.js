// Test de upload usando el token de sesión directamente
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

async function testUploadWithToken() {
  console.log('🔍 Testing upload with different approaches...\n');

  // 1. Test con Service Role (debería funcionar siempre)
  console.log('1. Testing with Service Role Key...');
  const supabaseAdmin = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  );

  const testFile = new Blob(['Test content'], { type: 'text/plain' });
  const userId = 'e93ddb24-82ca-46fc-b8fa-b24f184c0558';
  const memoryId = `test-${Date.now()}`;
  const filePath = `${userId}/${memoryId}/test.txt`;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from('memories')
      .upload(filePath, testFile, {
        contentType: 'text/plain',
        upsert: true
      });

    if (error) {
      console.error('   ❌ Service role upload failed:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('   ✅ Service role upload succeeded!');
      console.log('   Path:', data.path);
      
      // Clean up
      await supabaseAdmin.storage.from('memories').remove([filePath]);
      console.log('   🧹 Cleaned up test file');
    }
  } catch (err) {
    console.error('   💥 Exception:', err);
  }

  // 2. Check bucket configuration
  console.log('\n2. Checking bucket configuration...');
  const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
  
  if (bucketsError) {
    console.error('   ❌ Error listing buckets:', bucketsError);
  } else {
    const memoriesBucket = buckets.find(b => b.name === 'memories');
    if (memoriesBucket) {
      console.log('   ✅ Memories bucket found:');
      console.log('   - ID:', memoriesBucket.id);
      console.log('   - Name:', memoriesBucket.name);
      console.log('   - Public:', memoriesBucket.public);
      console.log('   - Created at:', memoriesBucket.created_at);
      console.log('   - Updated at:', memoriesBucket.updated_at);
      console.log('   - File size limit:', memoriesBucket.file_size_limit);
      console.log('   - Allowed MIME types:', memoriesBucket.allowed_mime_types);
    }
  }

  // 3. Try recreating the bucket with proper settings
  console.log('\n3. Attempting to recreate bucket with proper settings...');
  
  // First delete the old bucket
  const { error: deleteError } = await supabaseAdmin.storage.deleteBucket('memories');
  if (deleteError && !deleteError.message.includes('not found')) {
    console.log('   ⚠️  Could not delete bucket:', deleteError.message);
  } else {
    console.log('   ✅ Old bucket deleted');
  }

  // Create new bucket
  const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('memories', {
    public: false,
    fileSizeLimit: 52428800, // 50MB
    // Don't specify allowedMimeTypes to allow all types
  });

  if (createError) {
    console.log('   ❌ Could not create bucket:', createError.message);
  } else {
    console.log('   ✅ New bucket created successfully');
  }

  console.log('\n📝 Next steps:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Run this SQL to enable RLS and create a simple policy:');
  console.log(`
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Give users full access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_views" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_updates" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_deletes" ON storage.objects;

-- Create a simple policy for authenticated users
CREATE POLICY "Authenticated users can upload to memories bucket" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'memories');

CREATE POLICY "Authenticated users can view memories bucket" 
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'memories');

CREATE POLICY "Authenticated users can update memories bucket" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'memories');

CREATE POLICY "Authenticated users can delete from memories bucket" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'memories');
  `);
}

testUploadWithToken();