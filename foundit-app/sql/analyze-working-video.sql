-- Analizar la estructura de metadata del video que funciona correctamente
-- Buscar el video que acabas de re-ingresar manualmente

SELECT 
    id,
    title,
    type,
    url,
    content,
    metadata,
    created_at,
    updated_at
FROM memories 
WHERE url LIKE '%youtube.com%' 
    AND metadata IS NOT NULL
    AND jsonb_path_exists(metadata, '$.youtube.transcript')
ORDER BY created_at DESC 
LIMIT 3;

-- También analizar la estructura JSON específica
SELECT 
    title,
    url,
    jsonb_pretty(metadata) as formatted_metadata
FROM memories 
WHERE url LIKE '%youtube.com%' 
    AND metadata IS NOT NULL
    AND jsonb_path_exists(metadata, '$.youtube.transcript')
ORDER BY created_at DESC 
LIMIT 1;