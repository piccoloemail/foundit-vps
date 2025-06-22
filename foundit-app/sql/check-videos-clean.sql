ALTER TABLE memories DISABLE ROW LEVEL SECURITY;

SELECT 
  id,
  title,
  type,
  url,
  CASE 
    WHEN metadata->'youtube' IS NOT NULL THEN 'SI'
    ELSE 'NO'
  END as tiene_youtube_metadata,
  CASE 
    WHEN metadata->'youtube'->>'transcript' IS NOT NULL THEN 'SI'
    ELSE 'NO'
  END as tiene_transcripcion,
  CASE 
    WHEN metadata->'youtube'->'aiSummary' IS NOT NULL THEN 'SI'
    ELSE 'NO'
  END as tiene_resumen_ia,
  LENGTH(metadata->'youtube'->>'transcript') as longitud_transcripcion,
  created_at
FROM memories 
WHERE type = 'video'
OR url LIKE '%youtube%'
OR metadata->'youtube' IS NOT NULL
ORDER BY created_at DESC;

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;