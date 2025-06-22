// Script para probar la búsqueda semántica con datos existentes
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
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSemanticSearch() {
  console.log('🔍 Probando búsqueda semántica...\n');
  
  try {
    // 1. Obtener memorias existentes
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Error obteniendo memorias:', error);
      return;
    }

    console.log(`📊 Total de memorias encontradas: ${memories?.length || 0}\n`);

    if (!memories || memories.length === 0) {
      console.log('⚠️ No hay memorias en la base de datos.');
      console.log('\n💡 Para probar la búsqueda semántica necesitas:');
      console.log('1. Agregar algunas memorias de videos');
      console.log('2. Asegurarte de que tengan metadata con resúmenes AI\n');
      return;
    }

    // 2. Mostrar memorias disponibles
    console.log('📋 Memorias disponibles:');
    memories.forEach((mem, i) => {
      console.log(`\n${i + 1}. ${mem.title}`);
      console.log(`   Tipo: ${mem.type}`);
      console.log(`   URL: ${mem.url || 'N/A'}`);
      
      if (mem.metadata?.youtube?.aiSummary) {
        const summary = mem.metadata.youtube.aiSummary;
        console.log(`   ✅ Tiene resumen AI`);
        console.log(`   📌 Tema: ${summary.mainTopic || 'N/A'}`);
        console.log(`   🔧 Herramientas: ${summary.toolsMentioned?.join(', ') || 'N/A'}`);
      } else {
        console.log(`   ❌ Sin resumen AI`);
      }
    });

    // 3. Ejemplos de búsquedas semánticas
    console.log('\n\n🧪 Ejemplos de búsquedas semánticas que puedes probar:\n');
    
    const ejemplos = [
      "¿Cómo empezar con React?",
      "Videos sobre inteligencia artificial",
      "Tutoriales de programación web",
      "Herramientas para diseño UI/UX",
      "¿Qué es MCP?",
      "Mejores prácticas de desarrollo",
      "Videos que expliquen APIs",
      "Curso de JavaScript para principiantes"
    ];

    ejemplos.forEach((ejemplo, i) => {
      console.log(`${i + 1}. "${ejemplo}"`);
    });

    console.log('\n💡 Estas búsquedas activarán el modo semántico automáticamente.');
    console.log('   También puedes forzar el modo con el selector en la UI.\n');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testSemanticSearch();