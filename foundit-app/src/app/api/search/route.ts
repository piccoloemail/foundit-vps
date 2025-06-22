import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializar OpenAI con la clave del servidor
const openaiKey = process.env.OPENAI_API_KEY;

if (!openaiKey) {
  throw new Error('Missing OpenAI API key');
}

const openai = new OpenAI({
  apiKey: openaiKey,
});

export async function POST(request: NextRequest) {
  try {
    const { query, memories } = await request.json();
    
    if (!query || !memories || !Array.isArray(memories)) {
      return NextResponse.json(
        { error: 'Invalid request: query and memories array required' },
        { status: 400 }
      );
    }

    // Preparar contexto de videos para la IA
    const videosContext = memories
      .filter(m => m.type === 'video')
      .map(memory => {
        const youtube = memory.metadata?.youtube;
        return {
          id: memory.id,
          title: memory.title,
          summary: youtube?.aiSummary?.summary || 'No summary available',
          mainTopic: youtube?.aiSummary?.mainTopic || '',
          tools: youtube?.aiSummary?.toolsMentioned || [],
          concepts: youtube?.aiSummary?.keyConcepts || [],
          content: memory.content || '',
          tags: memory.tags || []
        };
      })
      .slice(0, 20); // Limitar a 20 videos

    if (videosContext.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const prompt = `
Eres un asistente experto en búsqueda de contenido. El usuario está buscando videos específicos.

CONSULTA DEL USUARIO: "${query}"

VIDEOS DISPONIBLES:
${videosContext.map((video, index) => `
${index + 1}. "${video.title}"
   - Tema: ${video.mainTopic}
   - Resumen: ${video.summary}
   - Herramientas: ${video.tools.join(', ')}
   - Conceptos: ${video.concepts.join(', ')}
   - Tags: ${video.tags.join(', ')}
`).join('\n')}

INSTRUCCIONES:
1. Analiza qué videos responden mejor a la consulta del usuario
2. Considera conceptos similares, sinónimos y contexto
3. Responde SOLO con los números de los videos relevantes
4. Ordena por relevancia (más relevante primero)
5. Si ningún video es relevante, responde "NONE"

FORMATO DE RESPUESTA:
Solo números separados por comas: 1,3,7,12
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un experto en búsqueda semántica. Responde únicamente con números separados por comas, o 'NONE' si no hay matches."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 100
    });

    const result = response.choices[0].message.content?.trim();
    
    if (!result || result === 'NONE') {
      return NextResponse.json({ results: [] });
    }

    // Parsear números y devolver IDs de memorias
    const indices = result
      .split(',')
      .map(num => parseInt(num.trim()) - 1)
      .filter(index => index >= 0 && index < videosContext.length);

    const matchedIds = indices.map(index => videosContext[index].id);

    return NextResponse.json({ 
      results: matchedIds,
      debug: {
        query,
        totalVideos: videosContext.length,
        matchedCount: matchedIds.length,
        aiResponse: result
      }
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    );
  }
}