// Test directo de storage con service role
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

// Cliente con service role (sin RLS)
const supabaseAdmin = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

// Cliente con anon key (con RLS)
const supabaseClient = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testStorage() {
  console.log('🧪 Testing Storage Upload...\n');

  const userId = 'e93ddb24-82ca-46fc-b8fa-b24f184c0558';
  const memoryId = '818022bf-d033-4f9c-96da-ac966a2da32e';
  const fileName = 'test-file.txt';
  const filePath = `${userId}/${memoryId}/${fileName}`;
  
  console.log('📁 File path:', filePath);
  console.log('👤 User ID:', userId);

  // 1. Test con Service Role (sin RLS)
  console.log('\n1. Testing with Service Role (no RLS)...');
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('memories')
      .upload(filePath, new Blob(['Test content from service role']), { 
        upsert: true 
      });
    
    if (error) {
      console.error('   ❌ Service role upload failed:', error);
    } else {
      console.log('   ✅ Service role upload succeeded!');
      console.log('   📄 File uploaded to:', data.path);
      
      // Limpiar
      await supabaseAdmin.storage.from('memories').remove([filePath]);
      console.log('   🧹 File cleaned up');
    }
  } catch (err) {
    console.error('   💥 Error:', err);
  }

  // 2. Test con Anon Key (con RLS) - simulando un usuario autenticado
  console.log('\n2. Testing with Anon Key (with RLS)...');
  
  // Primero, obtener la sesión actual si existe
  const { data: { session } } = await supabaseClient.auth.getSession();
  console.log('   Current session:', session ? 'Active' : 'None');
  
  if (!session) {
    console.log('   ⚠️  No active session. You need to be logged in to test RLS.');
    console.log('   💡 To test properly, run this after logging in to the app.');
    return;
  }

  try {
    const { data, error } = await supabaseClient.storage
      .from('memories')
      .upload(filePath, new Blob(['Test content from authenticated user']), { 
        upsert: true 
      });
    
    if (error) {
      console.error('   ❌ Authenticated upload failed:', error);
    } else {
      console.log('   ✅ Authenticated upload succeeded!');
      console.log('   📄 File uploaded to:', data.path);
      
      // Limpiar
      await supabaseClient.storage.from('memories').remove([filePath]);
      console.log('   🧹 File cleaned up');
    }
  } catch (err) {
    console.error('   💥 Error:', err);
  }

  // 3. Verificar estructura del bucket
  console.log('\n3. Checking bucket structure...');
  const { data: files, error: listError } = await supabaseAdmin.storage
    .from('memories')
    .list(userId, {
      limit: 10,
      offset: 0
    });
  
  if (listError) {
    console.error('   ❌ Error listing files:', listError);
  } else {
    console.log(`   📁 Found ${files?.length || 0} folders/files for user ${userId}`);
    if (files && files.length > 0) {
      files.forEach(file => {
        console.log(`      - ${file.name}`);
      });
    }
  }
}

testStorage();