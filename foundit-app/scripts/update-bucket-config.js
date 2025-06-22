// Script para actualizar la configuración del bucket
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

async function updateBucketConfig() {
  console.log('🔧 Updating bucket configuration...\n');

  try {
    // Primero, eliminar el bucket existente
    console.log('1. Deleting existing bucket...');
    const { error: deleteError } = await supabase.storage.deleteBucket('memories');
    
    if (deleteError && !deleteError.message.includes('not found')) {
      console.error('   ❌ Error deleting bucket:', deleteError);
    } else {
      console.log('   ✅ Bucket deleted or didn\'t exist');
    }

    // Crear nuevo bucket sin restricciones de MIME type
    console.log('\n2. Creating new bucket without MIME restrictions...');
    const { data, error: createError } = await supabase.storage.createBucket('memories', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      // NO especificamos allowedMimeTypes para permitir todos los tipos
    });

    if (createError) {
      console.error('   ❌ Error creating bucket:', createError);
      
      // Si el bucket ya existe, intentemos obtener info
      console.log('\n3. Checking existing bucket...');
      const { data: buckets } = await supabase.storage.listBuckets();
      const memoriesBucket = buckets?.find(b => b.name === 'memories');
      
      if (memoriesBucket) {
        console.log('   Bucket exists with config:', {
          public: memoriesBucket.public,
          fileSizeLimit: memoriesBucket.file_size_limit,
          allowedMimeTypes: memoriesBucket.allowed_mime_types
        });
      }
    } else {
      console.log('   ✅ Bucket created successfully!');
      console.log('   Configuration:');
      console.log('   - Public: false');
      console.log('   - File size limit: 50MB');
      console.log('   - Allowed MIME types: ALL (no restrictions)');
    }

    console.log('\n📋 Next steps:');
    console.log('1. Go to Supabase Dashboard > Storage > Policies');
    console.log('2. Add the following RLS policies for the "memories" bucket:');
    console.log('\n   INSERT Policy:');
    console.log('   - Name: allow_authenticated_uploads');
    console.log('   - Target roles: authenticated');
    console.log('   - WITH CHECK: bucket_id = \'memories\' AND auth.uid()::text = (storage.foldername(name))[1]');
    console.log('\n   SELECT Policy:');
    console.log('   - Name: allow_authenticated_views');
    console.log('   - Target roles: authenticated');
    console.log('   - USING: bucket_id = \'memories\' AND auth.uid()::text = (storage.foldername(name))[1]');

    console.log('\n💡 Alternative: Use SQL Editor with this query:');
    console.log(`
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
    console.error('💥 Error:', error);
  }
}

updateBucketConfig();