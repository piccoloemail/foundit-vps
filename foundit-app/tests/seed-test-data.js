// Script para crear datos de prueba en Supabase
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

// Datos de prueba con metadata rica para búsqueda semántica
const testMemories = [
  {
    title: 'Complete React Tutorial for Beginners 2024',
    content: 'Learn React from scratch with this comprehensive tutorial covering hooks, state management, and best practices.',
    url: 'https://www.youtube.com/watch?v=abc123react',
    type: 'video',
    category: 'Development',
    tags: ['react', 'javascript', 'frontend', 'tutorial'],
    metadata: {
      youtube: {
        videoId: 'abc123react',
        aiSummary: {
          mainTopic: 'React fundamentals and modern development',
          toolsMentioned: ['react', 'vscode', 'npm', 'create-react-app', 'react-devtools'],
          keyConcepts: ['components', 'hooks', 'state', 'props', 'jsx', 'virtual-dom'],
          summary: 'Comprehensive React tutorial covering components, hooks, state management, and building a complete application from scratch.'
        }
      }
    }
  },
  {
    title: 'Introduction to Machine Learning with Python',
    content: 'Beginner-friendly guide to ML concepts using Python, TensorFlow, and scikit-learn.',
    url: 'https://www.youtube.com/watch?v=xyz789ml',
    type: 'video',
    category: 'AI/ML',
    tags: ['python', 'machine-learning', 'ai', 'tensorflow'],
    metadata: {
      youtube: {
        videoId: 'xyz789ml',
        aiSummary: {
          mainTopic: 'Machine Learning basics with Python',
          toolsMentioned: ['python', 'jupyter', 'tensorflow', 'scikit-learn', 'pandas', 'numpy'],
          keyConcepts: ['neural-networks', 'classification', 'regression', 'supervised-learning', 'data-preprocessing'],
          summary: 'Learn the fundamentals of machine learning including data preparation, model training, and evaluation using Python.'
        }
      }
    }
  },
  {
    title: 'Model Context Protocol (MCP) Explained',
    content: 'Deep dive into MCP and how it revolutionizes AI agent communication.',
    url: 'https://www.youtube.com/watch?v=mcp567demo',
    type: 'video',
    category: 'AI',
    tags: ['mcp', 'ai-agents', 'anthropic', 'claude'],
    metadata: {
      youtube: {
        videoId: 'mcp567demo',
        aiSummary: {
          mainTopic: 'Model Context Protocol for AI agents',
          toolsMentioned: ['mcp', 'claude', 'openai', 'langchain', 'ai-apis'],
          keyConcepts: ['context-sharing', 'agent-communication', 'protocol-design', 'ai-integration'],
          summary: 'Explanation of how MCP enables better AI agent communication and context sharing across different systems.'
        }
      }
    }
  },
  {
    title: 'UI/UX Design Principles with Figma',
    content: 'Master the fundamentals of user interface and experience design using Figma.',
    url: 'https://www.youtube.com/watch?v=figma999',
    type: 'video',
    category: 'Design',
    tags: ['figma', 'ui', 'ux', 'design', 'prototyping'],
    metadata: {
      youtube: {
        videoId: 'figma999',
        aiSummary: {
          mainTopic: 'UI/UX design fundamentals and Figma workflow',
          toolsMentioned: ['figma', 'sketch', 'adobe-xd', 'framer', 'principle'],
          keyConcepts: ['design-systems', 'prototyping', 'user-research', 'wireframing', 'responsive-design'],
          summary: 'Comprehensive guide to UI/UX design principles and creating professional designs using Figma.'
        }
      }
    }
  },
  {
    title: 'Building REST APIs with Node.js and Express',
    content: 'Step-by-step tutorial on creating RESTful APIs using Node.js, Express, and MongoDB.',
    url: 'https://www.youtube.com/watch?v=nodeapi456',
    type: 'video',
    category: 'Backend',
    tags: ['nodejs', 'express', 'api', 'backend', 'mongodb'],
    metadata: {
      youtube: {
        videoId: 'nodeapi456',
        aiSummary: {
          mainTopic: 'REST API development with Node.js',
          toolsMentioned: ['nodejs', 'express', 'mongodb', 'postman', 'jwt', 'mongoose'],
          keyConcepts: ['rest-principles', 'middleware', 'authentication', 'crud-operations', 'api-design'],
          summary: 'Learn to build scalable REST APIs with Node.js, including authentication, database integration, and best practices.'
        }
      }
    }
  }
];

async function seedTestData() {
  console.log('🌱 Creando datos de prueba para búsqueda semántica...\n');
  
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ No estás autenticado. Por favor inicia sesión primero.');
      console.log('\n💡 Pasos:');
      console.log('1. Abre la aplicación en el navegador');
      console.log('2. Inicia sesión con tu cuenta');
      console.log('3. Vuelve a ejecutar este script\n');
      return;
    }

    console.log(`✅ Autenticado como: ${user.email}\n`);

    // Insertar memorias de prueba
    for (const memory of testMemories) {
      console.log(`📝 Creando: ${memory.title}`);
      
      const { data, error } = await supabase
        .from('memories')
        .insert([{
          ...memory,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Creada con ID: ${data.id}`);
      }
    }

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('\n🔍 Ahora puedes probar búsquedas semánticas como:');
    console.log('   - "¿Cómo empezar con React?"');
    console.log('   - "Videos sobre inteligencia artificial"');
    console.log('   - "Tutoriales de APIs"');
    console.log('   - "Herramientas para diseño"');
    console.log('   - "¿Qué es MCP?"');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Preguntar confirmación
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  Este script creará 5 memorias de prueba en tu base de datos.');
rl.question('¿Deseas continuar? (s/n): ', (answer) => {
  if (answer.toLowerCase() === 's') {
    seedTestData();
  } else {
    console.log('Operación cancelada.');
  }
  rl.close();
});