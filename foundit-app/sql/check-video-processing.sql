-- Verificar si los videos tienen transcripciones procesadas
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;

-- Ver videos de YouTube y su estado de procesamiento
SELECT 
  id,
  title,
  type,
  url,
  -- Verificar si tienen metadata de YouTube
  CASE 
    WHEN metadata->'youtube' IS NOT NULL THEN 'SÍ'
    ELSE 'NO'
  END as tiene_youtube_metadata,
  -- Verificar si tienen transcripción
  CASE 
    WHEN metadata->'youtube'->>'transcript' IS NOT NULL THEN 'SÍ'
    ELSE 'NO'
  END as tiene_transcripcion,
  -- Verificar si tienen resumen IA
  CASE 
    WHEN metadata->'youtube'->'aiSummary' IS NOT NULL THEN 'SÍ'
    ELSE 'NO'
  END as tiene_resumen_ia,
  -- Mostrar fecha de procesamiento
  metadata->'youtube'->>'processedAt' as fecha_procesamiento,
  -- Mostrar longitud de transcripción
  LENGTH(metadata->'youtube'->>'transcript') as longitud_transcripcion,
  created_at
FROM memories 
WHERE type = 'video'
OR url LIKE '%youtube%'
OR metadata->'youtube' IS NOT NULL
ORDER BY created_at DESC;

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;