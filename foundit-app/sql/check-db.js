⎿ // Script para verificar el procesamiento de videos en la base de datos
    // Ejecutar con: node check-db.js

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

    async function checkVideoProcessing() {
      try {
        console.log('🔍 Verificando videos de YouTube en la base de datos...\n');

        // Primero ver TODAS las memorias recientes
        console.log('📋 Verificando TODAS las memorias guardadas...\n');

        const { data: allMemories, error: allError } = await supabase
          .from('memories')
          .select('id, title, created_at, url, type, metadata')
          .order('created_at', { ascending: false })
          .limit(10);

        if (allError) {
          console.error('❌ Error obteniendo todos los videos:', allError);
          return;
        }

        if (allMemories && allMemories.length > 0) {
          console.log(`📋 Se encontraron ${allMemories.length} memoria(s) 
    total(es):\n`);

          allMemories.forEach((memory, index) => {
            console.log(`${index + 1}. ${memory.title}`);
            console.log(`   Tipo: ${memory.type}`);
            console.log(`   URL: ${memory.url || 'Sin URL'}`);
            console.log(`   Metadata YouTube: ${memory.metadata?.youtube ? 'SÍ' : 
    'NO'}`);
            console.log(`   ID: ${memory.id}`);
            console.log('');
          });
        } else {
          console.log('📭 No se encontraron memorias en la base de datos');
        }

        // Obtener videos de YouTube
        const { data: videos, error } = await supabase
          .from('memories')
          .select('id, title, created_at, url, metadata')
          .eq('type', 'video')
          .or('url.like.%youtube%,metadata->>youtube.neq.null')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('❌ Error:', error);
          return;
        }

        if (!videos || videos.length === 0) {
          console.log('📭 No se encontraron videos de YouTube guardados');
          return;
        }

        console.log(`📺 Se encontraron ${videos.length} video(s) de YouTube:\n`);

        videos.forEach((video, index) => {
          const youtube = video.metadata?.youtube || {};

          console.log(`--- VIDEO ${index + 1} ---`);
          console.log(`📝 Título: ${video.title}`);
          console.log(`🆔 ID: ${video.id}`);
          console.log(`📅 Creado: ${new Date(video.created_at).toLocaleString()}`);
          console.log(`🔗 URL: ${video.url}`);

          // Verificar transcripción
          if (youtube.transcript) {
            console.log(`✅ Transcripción: SÍ (${youtube.transcript.length} 
    caracteres)`);
          } else {
            console.log(`❌ Transcripción: NO`);
          }

          // Verificar resumen IA
          if (youtube.aiSummary) {
            console.log(`🤖 Resumen IA: SÍ`);
            if (youtube.aiSummary.mainTopic) {
              console.log(`   📋 Tema principal: ${youtube.aiSummary.mainTopic}`);
            }
            if (youtube.aiSummary.toolsMentioned) {
              console.log(`   🔧 Herramientas: 
    ${JSON.stringify(youtube.aiSummary.toolsMentioned)}`);
            }
            if (youtube.aiSummary.keyConcepts) {
              console.log(`   💡 Conceptos: 
    ${JSON.stringify(youtube.aiSummary.keyConcepts)}`);
            }
          } else {
            console.log(`❌ Resumen IA: NO`);
          }

          // Verificar fecha de procesamiento
          if (youtube.processedAt) {
            console.log(`⏰ Procesado en: ${youtube.processedAt}`);
          } else {
            console.log(`⏰ Sin procesar`);
          }

          console.log(''); // Línea en blanco
        });

      } catch (error) {
        console.error('💥 Error ejecutando script:', error);
      }
    }

    checkVideoProcessing();


⏺ Pasos para solucionarlo:

  1. Arreglar RLS en Supabase:
  - Ve a tu proyecto de Supabase
  - Ve a "SQL Editor"
  - Copia y pega todo el código del primer script SQL
  - Ejecuta

  2. Probar el sistema:
  - Guarda un video de YouTube en tu app
  - En terminal ejecuta: node check-db.js

  ¡Esto debería resolver el problema de RLS y permitir que las memorias se guarden
  correctamente!

> check-de.js\
  \
  ERROR:  42601: syntax error at or near "const"
  LINE 1: const fs = require('fs');

⏺ El error indica que estás ejecutando el archivo JavaScript en el SQL Editor de
  Supabase en lugar de en tu terminal.

  Tienes DOS scripts diferentes:

  1. Script SQL (Para Supabase SQL Editor)

  Copia y pega esto en Supabase SQL Editor:

  -- Script para corregir las políticas RLS en Supabase
  -- Ejecutar en Supabase SQL Editor

  -- 1. Verificar las políticas actuales
  SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
  FROM pg_policies
  WHERE tablename = 'memories';

  -- 2. Eliminar políticas existentes (si las hay)
  DROP POLICY IF EXISTS "Users can view own memories" ON memories;
  DROP POLICY IF EXISTS "Users can insert own memories" ON memories;
  DROP POLICY IF EXISTS "Users can update own memories" ON memories;
  DROP POLICY IF EXISTS "Users can delete own memories" ON memories;

  -- 3. Crear políticas RLS correctas
  -- Política para SELECT (leer memorias propias)
  CREATE POLICY "Users can view own memories" ON memories
    FOR SELECT USING (auth.uid() = user_id);

  -- Política para INSERT (crear memorias propias)
  CREATE POLICY "Users can insert own memories" ON memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- Política para UPDATE (actualizar memorias propias)
  CREATE POLICY "Users can update own memories" ON memories
    FOR UPDATE USING (auth.uid() = user_id);

  -- Política para DELETE (eliminar memorias propias)
  CREATE POLICY "Users can delete own memories" ON memories
    FOR DELETE USING (auth.uid() = user_id);

  -- 4. Asegurar que RLS esté habilitado
  ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

  -- 5. Verificar que las políticas se crearon correctamente
  SELECT
      policyname,
      cmd,
      qual,
      with_check
  FROM pg_policies
  WHERE tablename = 'memories';