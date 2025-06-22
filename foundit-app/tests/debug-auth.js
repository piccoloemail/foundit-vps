// Script para debuggear problemas de autenticación
const fs = require('fs');
const path = require('path');

// Leer variables de entorno del archivo .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAuth() {
  try {
    console.log('🔍 Debuggeando autenticación...\n');
    
    // Test 1: Verificar conexión básica
    console.log('1. Probando conexión básica a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('memories')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError);
      return;
    } else {
      console.log('✅ Conexión exitosa a Supabase');
    }
    
    // Test 2: Verificar auth.uid()
    console.log('\n2. Verificando auth.uid() actual...');
    const { data: authTest, error: authError } = await supabase
      .rpc('get_current_user_id');
    
    if (authError) {
      console.log('⚠️ No hay función get_current_user_id, creemos una consulta manual');
    } else {
      console.log('🆔 Usuario actual:', authTest);
    }
    
    // Test 3: Intentar insertar con el user_id de Chrome
    console.log('\n3. Intentando insertar memoria de prueba...');
    const testUserId = '2336d067-02ca-46fc-b8fa-b24f184c8536'; // Del log de Chrome
    
    const { data: insertData, error: insertError } = await supabase
      .from('memories')
      .insert([
        {
          title: 'Test Memory',
          type: 'note',
          content: 'Memoria de prueba para debugging',
          user_id: testUserId,
        }
      ])
      .select()
      .single();
      
    console.log('📥 Resultado del INSERT:', { data: insertData, error: insertError });
    
    // Test 4: Verificar si se guardó
    console.log('\n4. Verificando si la memoria se guardó...');
    const { data: checkData, error: checkError } = await supabase
      .from('memories')
      .select('*')
      .eq('title', 'Test Memory')
      .limit(1);
      
    console.log('📋 Memoria encontrada:', { data: checkData, error: checkError });
    
    // Test 5: Limpiar memoria de prueba
    if (checkData && checkData.length > 0) {
      console.log('\n5. Limpiando memoria de prueba...');
      await supabase
        .from('memories')
        .delete()
        .eq('id', checkData[0].id);
      console.log('🗑️ Memoria de prueba eliminada');
    }
    
  } catch (error) {
    console.error('💥 Error en debugging:', error);
  }
}

debugAuth();