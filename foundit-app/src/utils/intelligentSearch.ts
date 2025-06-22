'use client';

import { Memory } from '@/lib/supabase';

export type SearchMode = 'literal' | 'semantic' | 'auto';

export interface SearchResult {
  memories: Memory[];
  searchMode: 'literal' | 'semantic';
  processingTime: number;
  confidence?: number;
}

/**
 * Detecta automáticamente si una consulta requiere búsqueda semántica
 */
export function detectQueryType(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  
  // Indicadores de búsqueda semántica
  const semanticIndicators = [
    // Palabras interrogativas
    'cómo', 'qué', 'por qué', 'cuál', 'cuáles', 'dónde', 'cuándo', 'quién',
    'how', 'what', 'why', 'which', 'where', 'when', 'who',
    
    // Frases que indican búsqueda conceptual
    'videos sobre', 'videos de', 'videos que',
    'herramientas para', 'herramientas de',
    'tutorial de', 'tutorial para', 'tutorial sobre',
    'explica', 'explicar', 'enseña', 'enseñar',
    'aprende', 'aprender', 'curso de',
    'mejor', 'mejores', 'recomendación', 'recomienda',
    'comparación', 'diferencia', 'vs',
    
    // Videos específicos
    'videos about', 'videos on', 'tutorials for',
    'best tools', 'how to', 'learn about'
  ];
  
  // Detectar indicadores semánticos
  const hasSemanticIndicators = semanticIndicators.some(indicator => 
    lowerQuery.includes(indicator)
  );
  
  // Detectar preguntas
  const hasQuestionMarks = lowerQuery.includes('?');
  
  // Detectar consultas largas (probablemente conceptuales)
  const isLongQuery = query.split(' ').length > 4;
  
  // Detectar consultas con múltiples conceptos
  const hasMultipleConcepts = query.split(' ').length > 2 && 
    !hasExactMatch(lowerQuery);
  
  return hasSemanticIndicators || hasQuestionMarks || 
         (isLongQuery && hasMultipleConcepts);
}

/**
 * Detecta si es una búsqueda exacta/literal
 */
function hasExactMatch(query: string): boolean {
  // Herramientas/tecnologías comunes (búsqueda literal)
  const exactTerms = [
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt',
    'javascript', 'typescript', 'python', 'java', 'php', 'ruby',
    'nodejs', 'express', 'django', 'flask', 'laravel',
    'html', 'css', 'sass', 'scss', 'tailwind',
    'git', 'github', 'gitlab', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'vercel', 'netlify',
    'mongodb', 'postgresql', 'mysql', 'redis',
    'openai', 'chatgpt', 'claude', 'gemini',
    'figma', 'sketch', 'adobe', 'canva', 'framer',
    'vscode', 'cursor', 'webstorm', 'vim', 'emacs'
  ];
  
  return exactTerms.some(term => query.toLowerCase() === term);
}

/**
 * Búsqueda literal mejorada (actual)
 */
export function literalSearch(memories: Memory[], query: string): Memory[] {
  const lowerQuery = query.toLowerCase().trim();
  
  return memories.filter(memory => {
    // Búsqueda en campos básicos
    const matchesBasic = 
      memory.title.toLowerCase().includes(lowerQuery) ||
      (memory.content && memory.content.toLowerCase().includes(lowerQuery)) ||
      (memory.url && memory.url.toLowerCase().includes(lowerQuery)) ||
      (memory.tags && memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    
    // Búsqueda en transcripciones y resúmenes IA
    if (memory.metadata?.youtube) {
      const youtube = memory.metadata.youtube;
      
      const matchesTranscript = youtube.transcript && 
        youtube.transcript.toLowerCase().includes(lowerQuery);
      
      const matchesAI = youtube.aiSummary && (
        (youtube.aiSummary.mainTopic && youtube.aiSummary.mainTopic.toLowerCase().includes(lowerQuery)) ||
        (youtube.aiSummary.summary && youtube.aiSummary.summary.toLowerCase().includes(lowerQuery)) ||
        (youtube.aiSummary.toolsMentioned && youtube.aiSummary.toolsMentioned.some((tool: string) => 
          tool.toLowerCase().includes(lowerQuery))) ||
        (youtube.aiSummary.keyConcepts && youtube.aiSummary.keyConcepts.some((concept: string) => 
          concept.toLowerCase().includes(lowerQuery)))
      );
      
      return matchesBasic || matchesTranscript || matchesAI;
    }
    
    return matchesBasic;
  });
}

/**
 * Búsqueda semántica con IA
 */
export async function semanticSearch(memories: Memory[], query: string): Promise<Memory[]> {
  try {
    // Llamar al endpoint API para búsqueda semántica
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, memories }),
    });

    if (!response.ok) {
      throw new Error('Failed to perform semantic search');
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Mapear IDs a memorias completas
    return data.results
      .map((id: string) => memories.find(m => m.id === id))
      .filter(Boolean);

  } catch (error) {
    console.error('Error in semantic search:', error);
    // Fallback a búsqueda literal si falla la IA
    return literalSearch(memories, query);
  }
}

/**
 * Búsqueda inteligente que decide automáticamente el método
 */
export async function intelligentSearch(
  memories: Memory[], 
  query: string, 
  mode: SearchMode = 'auto'
): Promise<SearchResult> {
  const startTime = Date.now();
  
  if (mode === 'literal' || (mode === 'auto' && !detectQueryType(query))) {
    // Búsqueda literal rápida
    const results = literalSearch(memories, query);
    return {
      memories: results,
      searchMode: 'literal',
      processingTime: Date.now() - startTime
    };
  } else {
    // Búsqueda semántica con IA
    const results = await semanticSearch(memories, query);
    return {
      memories: results,
      searchMode: 'semantic',
      processingTime: Date.now() - startTime,
      confidence: results.length > 0 ? 0.8 : 0.1
    };
  }
}