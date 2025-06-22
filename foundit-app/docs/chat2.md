# Instrucciones para Resolver Problemas de Transcripción de YouTube

## Resumen del Problema

El sistema de transcripción de videos de YouTube está implementado pero falla debido a problemas de RLS (Row Level Security) en Supabase. Cuando se crea una memoria:

1. El frontend crea la memoria pero Supabase devuelve data vacío (problema de RLS)
2. El API endpoint intenta buscar esa memoria pero no la encuentra (error 404)
3. La transcripción del video nunca se procesa

## APIs que Estamos Usando

1. **OpenAI API** (principal):
   - **Whisper API** para transcripción de audio
   - **GPT-4o-mini** para generar resúmenes inteligentes
   - Ubicación: `/src/utils/transcriptApi.ts`

2. **YouTube Transcript API** (fallback):
   - Biblioteca `youtube-transcript` para obtener transcripciones nativas
   - Intenta español primero, luego inglés

## Solución Recomendada (Más Segura)

### Paso 1: Hacer Backup

#### Opción A: Backup desde Supabase Dashboard
1. Ve a: https://supabase.com/dashboard/project/ffhspmgznqjtqhqbvznl
2. Ve a "Table Editor" → Selecciona tabla "memories"
3. Click en "Export" → "Export as CSV"

#### Opción B: Backup con SQL
1. Ve a SQL Editor en Supabase
2. Ejecuta:
```sql
-- Ver cuántas memorias hay
SELECT COUNT(*) as total_memories FROM memories;

-- Exportar todas las memorias
SELECT * FROM memories;
```
3. Click en "Download CSV"

#### Opción C: Backup Local
```bash
cd /Users/bjc/Documents/projects/foundit-at/foundit.at
echo "s" | node backup-supabase.js
```

### Paso 2: Agregar Service Role Key (Solución Recomendada)

Esta es la solución más segura que NO requiere cambiar políticas RLS:

1. **Obtener la Service Role Key:**
   - Ve a: https://supabase.com/dashboard/project/ffhspmgznqjtqhqbvznl/settings/api
   - En la sección "Project API keys", copia la clave "service_role"
   - ⚠️ NO copies la "anon" key que ya tienes

2. **Agregar a tu archivo `.env.local`:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

3. **Reiniciar el servidor:**
   ```bash
   npm run dev
   ```

**Importante sobre Service Role Key:**
- NUNCA la uses en código del cliente/frontend
- NUNCA la subas a git
- Solo úsala en API routes del servidor
- Tiene permisos completos (bypass RLS)

### Paso 3: Verificar que Funciona

1. Intenta crear una nueva memoria con un video de YouTube
2. Revisa los logs del servidor para ver si encuentra la memoria
3. Si funciona, la transcripción debería procesarse correctamente

## Alternativa: Modificar Políticas RLS (Más Riesgoso)

Si la solución con Service Role Key no funciona, puedes modificar las políticas RLS:

### Verificar Políticas Actuales (Sin Cambios)
```sql
-- Solo para VER las políticas actuales
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'memories';
```

### Script para Arreglar RLS
```sql
-- CUIDADO: Esto modifica las políticas de seguridad

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Enable read access for users" ON memories;
DROP POLICY IF EXISTS "Enable insert for users" ON memories;
DROP POLICY IF EXISTS "Enable update for users" ON memories;
DROP POLICY IF EXISTS "Enable delete for users" ON memories;

-- Crear nuevas políticas correctas
CREATE POLICY "Users can view own memories" ON memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON memories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON memories
    FOR DELETE USING (auth.uid() = user_id);

-- Asegurar que RLS esté habilitado
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
```

### Opción Nuclear (NO RECOMENDADA)
```sql
-- ⚠️ PELIGROSO: Solo para testing temporal
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
```

## Scripts de Utilidad Creados

1. **`check-db.js`** - Verifica memorias en la base de datos
   ```bash
   node check-db.js
   ```

2. **`check-specific-memory.js`** - Busca una memoria específica
   ```bash
   node check-specific-memory.js
   ```

3. **`backup-supabase.js`** - Hace backup local de memorias
   ```bash
   node backup-supabase.js
   ```

4. **`fix-supabase-rls.js`** - Muestra instrucciones para arreglar RLS
   ```bash
   node fix-supabase-rls.js
   ```

5. **`test-service-role.js`** - Verifica configuración de service role
   ```bash
   node test-service-role.js
   ```

## Archivos Modificados

1. **`/src/hooks/useMemories.ts`**
   - Agregado mejor manejo cuando Supabase devuelve data vacío
   - Previene procesamiento de videos si no se confirma creación

2. **`/src/components/NewMemoryModal.tsx`**
   - Maneja el caso cuando la memoria no se crea correctamente
   - Muestra mensaje de advertencia apropiado

3. **`/src/app/api/process-video/route.ts`**
   - Preparado para usar service role key cuando esté disponible
   - Fallback a anon key si no hay service role

## Estado Actual

- ✅ APIs configuradas correctamente (OpenAI, YouTube)
- ✅ Sistema de transcripción implementado
- ✅ Manejo de errores mejorado
- ❌ Problemas de RLS impiden guardar/leer memorias
- ⏳ Esperando agregar service role key para resolver

## Próximos Pasos

1. Agregar `SUPABASE_SERVICE_ROLE_KEY` a `.env.local`
2. Reiniciar servidor
3. Probar crear nueva memoria con video
4. Si funciona, el sistema está listo

## Mejoras Futuras Pendientes

- Implementar manejo de videos largos (>25MB)
- Agregar indicadores de progreso durante procesamiento
- Optimizar costos de API (caché, límites)
- Agregar soporte para procesamiento por lotes