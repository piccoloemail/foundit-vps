'use client';

import { useState, useEffect, useMemo } from 'react';
import { Memory } from '@/lib/supabase';
import { SearchMode, intelligentSearch } from '@/utils/intelligentSearch';

export interface SearchFilters {
  query: string;
  type: string;
  category: string;
  tags: string[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  searchMode: SearchMode;
}

export interface SearchSnippet {
  snippet: string;
  timestamp?: string; // for transcript matches
  relevanceScore?: number;
}

export interface SearchContext {
  memory: Memory;
  foundIn: 'title' | 'content' | 'transcript' | 'ai_summary' | 'tags' | 'url';
  snippets: SearchSnippet[]; // Array of snippets instead of single snippet
  totalMatches: number; // Total number of matches found
}

export function useSearch(memories: Memory[]) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    category: 'all',
    tags: [],
    dateRange: 'all',
    searchMode: 'auto',
  });

  const [activeQuery, setActiveQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchMode, setLastSearchMode] = useState<'literal' | 'semantic' | null>(null);
  const [semanticResults, setSemanticResults] = useState<Memory[] | null>(null); // null = no search, [] = no results
  const [searchContexts, setSearchContexts] = useState<SearchContext[]>([]); // Store search contexts

  // Función para generar contexto de búsqueda con múltiples snippets
  const generateSearchContext = (memory: Memory, query: string): SearchContext | null => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return null;

    console.log(`🔍 generateSearchContext for "${memory.title}" with query "${query}"`);
    console.log(`   Has youtube metadata:`, !!memory.metadata?.youtube);
    console.log(`   Has segments:`, !!memory.metadata?.youtube?.segments);
    console.log(`   Segments count:`, memory.metadata?.youtube?.segments?.length || 0);

    const allSnippets: {
      foundIn: 'title' | 'content' | 'transcript' | 'ai_summary' | 'tags' | 'url';
      snippets: SearchSnippet[];
    }[] = [];

    // 1. Check transcript segments (highest priority)
    if (memory.metadata?.youtube?.segments) {
      console.log(`🎯 Video "${memory.title}" has ${memory.metadata.youtube.segments.length} segments`);
      const transcriptSnippets: SearchSnippet[] = [];
      
      console.log(`🔄 Checking ${memory.metadata.youtube.segments.length} segments for "${lowerQuery}"`);
      
      for (let i = 0; i < memory.metadata.youtube.segments.length; i++) {
        const segment = memory.metadata.youtube.segments[i];
        console.log(`   Segment ${i}:`, {
          text: segment.text ? segment.text.substring(0, 40) + '...' : 'NO TEXT',
          startTime: segment.startTime,
          hasStartTime: !!segment.startTime,
          allKeys: Object.keys(segment),
          includesQuery: segment.text ? segment.text.toLowerCase().includes(lowerQuery) : false
        });
        
        if (segment.text && segment.text.toLowerCase().includes(lowerQuery)) {
          console.log('✅ MATCH FOUND! Adding to snippets:', {
            text: segment.text.substring(0, 50) + '...',
            startTime: segment.startTime,
            timestamp: segment.startTime
          });
          
          transcriptSnippets.push({
            snippet: segment.text,
            timestamp: segment.startTime,
            relevanceScore: 0.95
          });
        }
      }
      
      if (transcriptSnippets.length > 0) {
        allSnippets.push({
          foundIn: 'transcript',
          snippets: transcriptSnippets.slice(0, 5) // Limit to 5 matches
        });
      }
    }

    // 2. Fallback: check plain transcript (if no segments found)
    if (allSnippets.length === 0 && memory.metadata?.youtube?.transcript && memory.metadata.youtube.transcript.toLowerCase().includes(lowerQuery)) {
      const transcript = memory.metadata.youtube.transcript.toLowerCase();
      const transcriptText = memory.metadata.youtube.transcript;
      const transcriptSnippets: SearchSnippet[] = [];
      
      // Find multiple occurrences in plain transcript
      let searchIndex = 0;
      while (searchIndex < transcript.length && transcriptSnippets.length < 3) {
        const index = transcript.indexOf(lowerQuery, searchIndex);
        if (index === -1) break;
        
        const start = Math.max(0, index - 40);
        const end = Math.min(transcriptText.length, index + lowerQuery.length + 40);
        const snippetText = transcriptText.substring(start, end);
        
        // Try to extract timestamp from the snippet
        // Look for patterns like "10:30" or "1:23:45" near the match
        const timestampRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/;
        const timestampMatch = snippetText.match(timestampRegex);
        
        console.log('🔍 Searching in plain transcript:', {
          snippetText: snippetText.substring(0, 100) + '...',
          timestampMatch: timestampMatch ? timestampMatch[1] : 'none'
        });
        
        transcriptSnippets.push({
          snippet: `...${snippetText}...`,
          timestamp: timestampMatch ? timestampMatch[1] : undefined,
          relevanceScore: 0.85
        });
        
        searchIndex = index + lowerQuery.length;
      }
      
      if (transcriptSnippets.length > 0) {
        allSnippets.push({
          foundIn: 'transcript',
          snippets: transcriptSnippets
        });
      }
    }

    // 3. Check AI summary
    if (memory.metadata?.youtube?.aiSummary) {
      const aiSummary = memory.metadata.youtube.aiSummary;
      const aiSnippets: SearchSnippet[] = [];
      
      if (aiSummary.mainTopic && aiSummary.mainTopic.toLowerCase().includes(lowerQuery)) {
        aiSnippets.push({
          snippet: `Topic: ${aiSummary.mainTopic}`,
          relevanceScore: 0.75
        });
      }
      if (aiSummary.summary && aiSummary.summary.toLowerCase().includes(lowerQuery)) {
        aiSnippets.push({
          snippet: aiSummary.summary,
          relevanceScore: 0.7
        });
      }
      if (aiSummary.toolsMentioned && aiSummary.toolsMentioned.some((tool: string) => tool.toLowerCase().includes(lowerQuery))) {
        const matchingTools = aiSummary.toolsMentioned.filter((tool: string) => tool.toLowerCase().includes(lowerQuery));
        matchingTools.forEach(tool => {
          aiSnippets.push({
            snippet: `Tool mentioned: ${tool}`,
            relevanceScore: 0.65
          });
        });
      }
      
      if (aiSnippets.length > 0) {
        allSnippets.push({
          foundIn: 'ai_summary',
          snippets: aiSnippets
        });
      }
    }

    // 4. Check content
    if (memory.content && memory.content.toLowerCase().includes(lowerQuery)) {
      const content = memory.content.toLowerCase();
      const contentSnippets: SearchSnippet[] = [];
      
      // Find multiple occurrences in content
      let searchIndex = 0;
      while (searchIndex < content.length && contentSnippets.length < 3) {
        const index = content.indexOf(lowerQuery, searchIndex);
        if (index === -1) break;
        
        const start = Math.max(0, index - 30);
        const end = Math.min(memory.content!.length, index + lowerQuery.length + 30);
        const snippet = `...${memory.content!.substring(start, end)}...`;
        
        contentSnippets.push({
          snippet,
          relevanceScore: 0.8
        });
        
        searchIndex = index + lowerQuery.length;
      }
      
      if (contentSnippets.length > 0) {
        allSnippets.push({
          foundIn: 'content',
          snippets: contentSnippets
        });
      }
    }

    // 5. Check title (lower priority)
    if (memory.title.toLowerCase().includes(lowerQuery)) {
      allSnippets.push({
        foundIn: 'title',
        snippets: [{
          snippet: memory.title,
          relevanceScore: 0.6
        }]
      });
    }

    // 6. Check tags
    if (memory.tags && memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      const matchingTags = memory.tags.filter(tag => tag.toLowerCase().includes(lowerQuery));
      const tagSnippets: SearchSnippet[] = matchingTags.map(tag => ({
        snippet: `Tag: ${tag}`,
        relevanceScore: 0.5
      }));
      
      allSnippets.push({
        foundIn: 'tags',
        snippets: tagSnippets
      });
    }

    // 7. Check URL
    if (memory.url && memory.url.toLowerCase().includes(lowerQuery)) {
      allSnippets.push({
        foundIn: 'url',
        snippets: [{
          snippet: memory.url,
          relevanceScore: 0.4
        }]
      });
    }

    // Return the highest priority match with all snippets
    if (allSnippets.length > 0) {
      // Sort by priority (transcript > content > ai_summary > title > tags > url)
      const priorityOrder = ['transcript', 'content', 'ai_summary', 'title', 'tags', 'url'];
      allSnippets.sort((a, b) => {
        const aPriority = priorityOrder.indexOf(a.foundIn);
        const bPriority = priorityOrder.indexOf(b.foundIn);
        return aPriority - bPriority;
      });
      
      // Take the highest priority source
      const selectedSource = allSnippets[0];
      const totalMatches = allSnippets.reduce((sum, source) => sum + source.snippets.length, 0);
      
      console.log('🏆 Selected context:', {
        foundIn: selectedSource.foundIn,
        snippetsCount: selectedSource.snippets.length,
        totalMatches: totalMatches,
        firstSnippet: selectedSource.snippets[0].snippet.substring(0, 50) + '...',
        firstTimestamp: selectedSource.snippets[0].timestamp
      });
      
      return {
        memory,
        foundIn: selectedSource.foundIn,
        snippets: selectedSource.snippets,
        totalMatches: selectedSource.snippets.length
      };
    }

    return null;
  };

  // Función para ejecutar búsqueda manualmente
  const executeSearch = async () => {
    if (!filters.query.trim()) {
      setActiveQuery('');
      setSemanticResults(null); // Reset to "no search" state
      return;
    }

    setIsSearching(true);
    try {
      // Ejecutar búsqueda inteligente
      const searchResult = await intelligentSearch(memories, filters.query, filters.searchMode);
      
      console.log(`🔍 [${searchResult.searchMode.toUpperCase()}] Search completed:`, {
        query: filters.query,
        mode: filters.searchMode,
        resultsCount: searchResult.memories.length,
        processingTime: `${searchResult.processingTime}ms`
      });
      
      setLastSearchMode(searchResult.searchMode);
      
      if (searchResult.searchMode === 'semantic') {
        // Para búsqueda semántica, usar los resultados de IA
        setSemanticResults(searchResult.memories); // Puede ser [] si no hay resultados
        setActiveQuery(''); // No usar filtrado adicional
      } else {
        // Para búsqueda literal, usar el sistema de filtrado existente
        setSemanticResults(null); // null indica usar filtrado normal
        setActiveQuery(filters.query);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback a búsqueda literal
      setActiveQuery(filters.query);
      setSemanticResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Detectar si es consulta semántica
  const isSemanticQuery = (query: string): boolean => {
    const lowerQuery = query.toLowerCase().trim();
    const semanticIndicators = [
      'cómo', 'qué', 'por qué', 'cuál', 'dónde', 'cuándo',
      'videos sobre', 'herramientas para', 'tutorial de', 'explica'
    ];
    return semanticIndicators.some(indicator => lowerQuery.includes(indicator)) ||
           query.includes('?') || query.split(' ').length > 4;
  };

  // Permitir búsqueda con Enter
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      executeSearch();
    }
  };

  const filteredMemories = useMemo(() => {
    // Si hay resultados semánticos (incluyendo array vacío), usarlos directamente
    if (semanticResults !== null) {
      // Generate contexts for semantic results too
      if (filters.query.trim()) {
        const contexts = semanticResults.map(memory => generateSearchContext(memory, filters.query)).filter(Boolean) as SearchContext[];
        setSearchContexts(contexts);
      } else {
        setSearchContexts([]);
      }
      return semanticResults; // Puede ser [] si no hubo matches
    }
    
    let result = [...memories];
    let contexts: SearchContext[] = [];

    // Enhanced text search (title, content, url, transcriptions, AI summaries)
    if (activeQuery.trim()) {
      const query = activeQuery.toLowerCase().trim();
      
      // First pass: collect all memories with contexts
      const memoriesWithContexts: { memory: Memory; context: SearchContext }[] = [];
      
      for (const memory of result) {
        const context = generateSearchContext(memory, query);
        if (context) {
          memoriesWithContexts.push({ memory, context });
        }
      }
      
      // Sort by relevance score (highest first)
      memoriesWithContexts.sort((a, b) => (b.context.relevanceScore || 0) - (a.context.relevanceScore || 0));
      
      // Extract sorted memories and contexts
      result = memoriesWithContexts.map(item => item.memory);
      contexts = memoriesWithContexts.map(item => item.context);
    }

    // Type filter with intelligent filtering
    if (filters.type !== 'all') {
      if (filters.type === 'document') {
        // Document filter: only show documents that are NOT YouTube videos
        result = result.filter(memory => 
          memory.type === 'document' && !memory.metadata?.youtube
        );
      } else if (filters.type === 'link') {
        // Website filter: show only links (websites) that are NOT videos
        result = result.filter(memory => 
          memory.type === 'link' && !memory.metadata?.youtube
        );
      } else if (filters.type === 'video') {
        // Video filter: show videos (including YouTube videos from any type)
        result = result.filter(memory => 
          memory.type === 'video' || memory.metadata?.youtube
        );
      } else {
        // Other types: normal filtering
        result = result.filter(memory => memory.type === filters.type);
      }
    }

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter(memory => memory.category === filters.category);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter(memory => 
        memory.tags && filters.tags.every(filterTag => 
          memory.tags!.some(memoryTag => 
            memoryTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        )
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      result = result.filter(memory => 
        new Date(memory.created_at) >= filterDate
      );
    }

    // Update search contexts
    setSearchContexts(contexts);

    return result;
  }, [memories, activeQuery, filters.type, filters.category, filters.tags, filters.dateRange, semanticResults]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      type: 'all',
      category: 'all',
      tags: [],
      dateRange: 'all',
      searchMode: 'auto',
    });
    setActiveQuery('');
    setSemanticResults(null); // Reset to "no search" state
    setLastSearchMode(null);
    setSearchContexts([]); // Clear search contexts
  };

  // Get unique values for filter options
  const availableTypes = useMemo(() => {
    return Array.from(new Set(memories.map(m => m.type)));
  }, [memories]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(memories.map(m => m.category).filter(Boolean)));
  }, [memories]);

  const availableTags = useMemo(() => {
    const allTags = memories.flatMap(m => m.tags || []);
    return Array.from(new Set(allTags));
  }, [memories]);

  const hasActiveFilters = filters.query || filters.type !== 'all' || 
                          filters.category !== 'all' || filters.tags.length > 0 || 
                          filters.dateRange !== 'all';

  return {
    filters,
    filteredMemories,
    searchContexts, // Export search contexts
    updateFilter,
    clearFilters,
    executeSearch,
    isSearching,
    lastSearchMode,
    availableTypes,
    availableCategories,
    availableTags,
    hasActiveFilters,
    resultsCount: filteredMemories.length,
    totalCount: memories.length,
    handleKeyPress,
  };
}