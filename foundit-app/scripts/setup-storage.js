// Script para configurar Supabase Storage
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

// Usar service role key para configuración administrativa
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  console.log('🗂️  Configurando Supabase Storage...\n');

  try {
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      console.error('❌ Error listando buckets:', listError);
      return;
    }

    console.log('📦 Buckets existentes:', buckets.map(b => b.name).join(', ') || 'Ninguno');

    // Verificar si existe el bucket 'memories'
    const memoriesBucket = buckets.find(b => b.name === 'memories');

    if (!memoriesBucket) {
      console.log('\n📝 Creando bucket "memories"...');
      
      const { data, error: createError } = await supabase
        .storage
        .createBucket('memories', {
          public: false, // Privado por defecto
          fileSizeLimit: 52428800, // 50MB límite por archivo
          allowedMimeTypes: [
            'image/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/*',
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'application/zip',
            'application/x-zip-compressed'
          ]
        });

      if (createError) {
        console.error('❌ Error creando bucket:', createError);
      } else {
        console.log('✅ Bucket "memories" creado exitosamente');
      }
    } else {
      console.log('✅ Bucket "memories" ya existe');
    }

    // Información sobre políticas RLS
    console.log('\n📋 Políticas RLS sugeridas para el bucket:');
    console.log('1. INSERT: Usuarios autenticados pueden subir a su carpeta');
    console.log('2. SELECT: Usuarios pueden ver solo sus archivos');
    console.log('3. UPDATE: Usuarios pueden actualizar sus archivos');
    console.log('4. DELETE: Usuarios pueden eliminar sus archivos');
    
    console.log('\n💡 Estructura de carpetas sugerida:');
    console.log('memories/');
    console.log('  └── {user_id}/');
    console.log('      └── {memory_id}/');
    console.log('          └── archivo.ext');

    console.log('\n✅ Configuración completada!');
    console.log('\n⚠️  IMPORTANTE: Ve a Supabase Dashboard > Storage > Policies');
    console.log('   para configurar las políticas RLS del bucket "memories"');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

setupStorage();