// Test usando el header de autenticación directamente
const fetch = require('node-fetch');
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

async function testDirectUpload() {
  console.log('🔍 Testing direct upload with different auth methods...\n');

  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const userId = 'e93ddb24-82ca-46fc-b8fa-b24f184c0558';
  const memoryId = `test-${Date.now()}`;
  const fileName = 'test.txt';
  const filePath = `${userId}/${memoryId}/${fileName}`;
  
  // Test file content
  const fileContent = 'Test content for upload';
  const blob = new Blob([fileContent], { type: 'text/plain' });

  // 1. Test with Service Role Key
  console.log('1. Testing with Service Role Key...');
  try {
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/memories/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envVars.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'text/plain',
        },
        body: fileContent
      }
    );

    const responseText = await response.text();
    console.log('   Status:', response.status);
    console.log('   Response:', responseText);
    
    if (response.ok) {
      console.log('   ✅ Service role upload succeeded!');
      
      // Clean up
      await fetch(
        `${supabaseUrl}/storage/v1/object/memories/${filePath}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${envVars.SUPABASE_SERVICE_ROLE_KEY}`,
          }
        }
      );
      console.log('   🧹 Cleaned up test file');
    } else {
      console.log('   ❌ Service role upload failed');
    }
  } catch (error) {
    console.error('   💥 Error:', error.message);
  }

  // 2. Check what's happening with anon key
  console.log('\n2. Testing with Anon Key (simulating browser request)...');
  try {
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/memories/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'apikey': envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'text/plain',
        },
        body: fileContent
      }
    );

    const responseText = await response.text();
    console.log('   Status:', response.status);
    console.log('   Response:', responseText);
    
    if (response.status === 403) {
      console.log('   ❌ RLS policy is blocking the request');
      console.log('   This confirms the issue is with RLS policies');
    }
  } catch (error) {
    console.error('   💥 Error:', error.message);
  }

  console.log('\n📝 Solution: Contact Supabase support or try these alternatives:');
  console.log('\n1. Use Supabase Dashboard:');
  console.log('   - Go to Storage > Policies');
  console.log('   - Delete ALL policies for the memories bucket');
  console.log('   - Create new policies using the UI');
  console.log('\n2. Alternative approach - Use public bucket:');
  console.log('   - Delete the memories bucket');
  console.log('   - Create a new PUBLIC bucket');
  console.log('   - Use folder structure for security');
  console.log('\n3. Use a different storage solution:');
  console.log('   - Consider using Supabase Database to store file metadata');
  console.log('   - Use base64 encoding for small files');
  console.log('   - Use external storage (S3, Cloudinary, etc.)');
}

// Check if node-fetch is installed
try {
  require('node-fetch');
  testDirectUpload();
} catch (error) {
  console.log('Installing node-fetch...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch@2', { stdio: 'inherit' });
  console.log('Please run the script again.');
}