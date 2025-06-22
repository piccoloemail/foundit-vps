# 🎯 Optimización de Costos OpenAI para FoundIt.at

## 📊 Uso Actual de OpenAI API

### 1. **Resúmenes de Videos** (`src/utils/transcriptApi.ts`)
- **Modelo**: gpt-4o-mini
- **Costo**: ~$0.001 por video
- **Frecuencia**: Cada vez que subes un video con transcripción habilitada
- **Tokens promedio**: ~1500 tokens por resumen

### 2. **Búsqueda Semántica** (`src/utils/intelligentSearch.ts`)
- **Modelo**: Probablemente text-embedding-ada-002
- **Costo**: ~$0.0001 por búsqueda
- **Frecuencia**: Cuando usas modo "AI" en búsqueda

### 3. **API de Búsqueda** (`src/app/api/search/route.ts`)
- **Modelo**: Variable según endpoint
- **Costo**: Depende del uso

## 💰 Estrategias de Optimización

### 1. **Cache de Resúmenes**
```javascript
// Antes de llamar a OpenAI, verificar si ya existe resumen
if (memory.metadata?.youtube?.aiSummary) {
  return memory.metadata.youtube.aiSummary;
}
```

### 2. **Limitar Longitud de Transcripts**
```javascript
// Limitar a 6000 caracteres en lugar de 8000
const truncatedTranscript = transcript.substring(0, 6000);
```

### 3. **Modelo Más Económico**
Ya estás usando `gpt-4o-mini` que es más barato que `gpt-4`.

### 4. **Opciones de Control**
- **Checkbox**: "Enable AI Summary" (opcional)
- **Límite mensual**: Configurar alerta cuando llegues a X dólares

### 5. **Batch Processing**
En lugar de procesar cada video individualmente, agrupar múltiples videos.

## 🔧 Cambios Recomendados

### Opción A: Control Manual
Agregar checkbox en NewMemoryModal para controlar cuándo usar AI:
- [ ] Generate AI Summary ($0.001)
- [ ] Enable Semantic Search

### Opción B: Límites Automáticos
- Solo generar resumen si el video > 5 minutos
- Cache agresivo de resultados
- Usar embeddings locales para búsqueda

### Opción C: Modelo Local (Gratis)
- Usar Ollama o similar para resúmenes locales
- Más lento pero gratis

## 📈 Estimación de Costos

Con uso normal:
- **10 videos/día**: ~$0.01/día = $0.30/mes
- **50 búsquedas AI/día**: ~$0.005/día = $0.15/mes
- **Total estimado**: ~$0.45/mes

Con optimización:
- **Cache activo**: -50% de llamadas
- **Control manual**: -70% de llamadas
- **Total optimizado**: ~$0.15/mes

## 🎮 Acciones Inmediatas

1. **Ver uso actual**: https://platform.openai.com/usage
2. **Configurar alerta**: Settings → Billing → Usage limits
3. **Implementar cache** para evitar re-procesar
4. **Agregar controles** para el usuario

¿Cuál opción prefieres implementar?