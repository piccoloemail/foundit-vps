# Scripts para Actualizar DB - TRABAJO NO TERMINADO

## Estado Actual (20 Jun 2025, 2:37 PM)

El website funciona PERFECTAMENTE. Los scripts están 90% completos pero necesitan ajustes finales.

## El Problema Original

Los scripts (`send-to-n8n-test.js`, `process-all-videos-overnight.js`) enviaban videos a N8N y recibían respuestas exitosas, pero **nunca actualizaban Supabase**. Por eso reportaban éxito pero la DB no se actualizaba.

## La Solución Implementada

Creamos `test-single-video-with-db-update.js` que:

1. ✅ Busca video en Supabase
2. ✅ Envía a N8N (`http://localhost:5678/webhook/youtube-transcript`)
3. ✅ Recibe respuesta de N8N con transcript procesado
4. ✅ **ACTUALIZA SUPABASE** (esto faltaba en scripts originales)
5. ✅ Verifica que se guardó correctamente

## Formato de N8N (Confirmado)

N8N devuelve `transcriptWithTimestamps` en formato:
```
0:00
Cursor is amazing, but what if I told you there's a way to 10x its
[línea vacía]
0:03
power? Imagine if Cursor can generate your assets, manage your tasks, and even post for
[línea vacía]
0:08
you on social media, all automatically. That's where MCP comes in.
[línea vacía]
```

**Patrón:** timestamp → texto → línea vacía (se repite)

## Parsing Implementado

```javascript
// FORMATO CORRECTO: timestamp, texto, línea vacía
for (let i = 0; i < lines.length; i += 3) {
  const timeLine = lines[i]?.trim();
  const textLine = lines[i + 1]?.trim();
  // lines[i + 2] es línea vacía
  
  if (timeLine && textLine && timeLine.match(/^\d+:\d{2}$/)) {
    segments.push({
      time: timeLine,
      text: textLine,
      timestamp: timeLine
    });
  }
}
```

## Videos Probados

1. **IXJEGjfZRBE** - "I Built a NotebookLM Clone" 
   - ✅ 44,039 chars transcript
   - ✅ 622 segments creados
   - ❌ No funciona en web (formato incorrecto)

2. **EPDCuJIrMyI** - "How I Made Cursor AI 10x More Powerful"
   - ✅ 8,833 chars transcript  
   - ✅ 125 segments creados
   - ❌ No funciona en web (formato incorrecto)

## Problemas Pendientes

### 1. AI Summary se pierde
```javascript
// PROBLEMA: Esto sobrescribe AI Summary existente
const updatedMetadata = {
  ...currentMetadata,
  youtube: {
    ...currentMetadata?.youtube,  // ← Necesita preservar aiSummary
    // nuevo data aquí
  }
};
```

**SOLUCIÓN:** Preservar `aiSummary` explícitamente:
```javascript
youtube: {
  ...currentMetadata?.youtube,
  aiSummary: currentMetadata?.youtube?.aiSummary, // ← PRESERVAR
  // nuevos datos...
}
```

### 2. Formato de segments incorrecto

**Lo que funciona (ejemplo del usuario):**
```
0:00
By the end of this video, you'll be able to run AI agents on NN

0:02  
for completely free. Now I know that local AI can be pretty intimidating and I

0:06
myself don't really have that technical background or understand entering commands to a terminal.

0:11
But we're going to go through this journey together and by the end of this
```

**Lo que genera el script:**
```
Segment 1: time: "0:00", text: "Cursor is amazing, but what if I told you there's a way to 10x its"
Segment 2: time: "0:03", text: "power? Imagine if Cursor can generate your assets, manage your tasks, and even post for"
```

**DIFERENCIA:** El formato "bueno" tiene oraciones más largas y completas, el script genera fragmentos cortados.

### 3. Estructura segments esperada por la web

Necesitamos revisar:
- ¿Cómo están estructurados los segments en un video que funciona?
- ¿Qué propiedades exactas espera la web?
- ¿Es un problema de parsing o de estructura del objeto?

## Archivos Relevantes

### Scripts Funcionales
- `test-single-video-with-db-update.js` - Script de prueba que SÍ actualiza DB
- `send-to-n8n-test.js` - Script original que NO actualiza DB
- `process-all-videos-overnight.js` - Script masivo que NO actualiza DB

### N8N Workflow
- `/Users/bjc/Downloads/n8n-wf008.json` - Workflow completo
- **Code3** (líneas 212-222) - Lógica de formateo de timestamps

### Utilitarios
- `check-specific-memory.js` - Para verificar videos en DB
- `count-all-videos.js` - Estadísticas de videos

## Próximos Pasos (Cuando retomemos)

1. **Comparar formato:**
   - Tomar un video que funciona perfectamente en web
   - Extraer su estructura exacta de segments  
   - Comparar con lo que genera nuestro script

2. **Preservar AI Summary:**
   - Modificar script para no sobrescribir metadata existente
   - Hacer merge inteligente de datos

3. **Investigar formato segments:**
   - ¿Por qué las oraciones del usuario son más largas?
   - ¿Necesita post-processing después del parsing?
   - ¿Hay propiedades adicionales en segments?

4. **Aplicar solución al script masivo:**
   - Una vez que funcione el script de prueba
   - Aplicar misma lógica a `process-all-videos-overnight.js`

## Estado del Website

✅ **EL WEBSITE FUNCIONA PERFECTAMENTE** - No tocar nada del frontend/web.

El problema está solo en los scripts que querían automatizar el proceso masivo.

## Costo y Beneficio

- **Costo por video:** ~$0.36 (1 hora promedio)
- **Script actual:** Procesa pero formato incorrecto
- **Website manual:** Funciona perfecto pero lento para masivo

**Objetivo:** Automatizar el proceso masivo manteniendo la calidad del website.