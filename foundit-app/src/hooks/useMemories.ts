'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Memory } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchMemories = async () => {
    if (!user) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching memories:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createMemory = async (memoryData: {
    title: string;
    content?: string;
    url?: string;
    type: 'document' | 'note' | 'link' | 'text' | 'image' | 'video';
    category?: string;
    tags?: string[];
    metadata?: any;
  }) => {
    console.log('💾 Iniciando creación de memoria...');
    console.log('👤 Usuario autenticado:', !!user, user?.id);
    console.log('📋 Datos de memoria:', memoryData);
    
    // Verificar sesión de Supabase
    const { data: session } = await supabase.auth.getSession();
    console.log('🔐 Sesión de Supabase:', session.session ? 'ACTIVA' : 'INACTIVA');
    console.log('🆔 User ID de sesión:', session.session?.user?.id);
    
    if (!user) throw new Error('User not authenticated');

    // Check for duplicates if it's a YouTube video
    if ((memoryData.type === 'video' || memoryData.type === 'document' || memoryData.type === 'link') && memoryData.url) {
      const duplicate = await checkForDuplicateYouTubeVideo(memoryData.url, memoryData.metadata);
      if (duplicate) {
        const duplicateError = new Error(`⚠️ This video is already saved as: "${duplicate.title}"`);
        duplicateError.name = 'DuplicateError';
        throw duplicateError;
      }
    }

    console.log('📤 Enviando a Supabase...');
    
    const insertData = {
      ...memoryData,
      user_id: user.id,
    };
    
    console.log('📝 Data to insert:', insertData);
    
    const { data, error } = await supabase
      .from('memories')
      .insert([insertData])
      .select()
      .single();

    console.log('📥 Respuesta de Supabase:', { data, error });

    if (error) {
      console.error('❌ Error de Supabase:', error);
      throw error;
    }

    // Verificar si el data está vacío (problema de RLS)
    if (!data || Object.keys(data).length === 0) {
      console.warn('⚠️ Supabase devolvió data vacío - posible problema de RLS');
      console.log('🔄 Intentando crear sin esperar respuesta...');
      
      // Si no hay datos, crear un objeto mock con el ID esperado
      const mockData = {
        id: crypto.randomUUID(),
        ...memoryData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📦 Usando datos mock para continuar:', mockData);
      
      // Actualizar estado local inmediatamente
      await fetchMemories();
      
      // Para videos de YouTube, NO procesar en background si no tenemos confirmación
      if (memoryData.type === 'video' && memoryData.url?.includes('youtube.com')) {
        console.warn('⚠️ Saltando procesamiento de video debido a problemas de RLS');
        // toast.error('Video guardado pero transcripción deshabilitada temporalmente');
        return mockData;
      }
      
      return mockData;
    }
    
    // Si tenemos data, continuar normalmente
    console.log('✅ Memoria creada exitosamente con ID:', data.id);
    
    // Add to local state
    setMemories(prev => [data, ...prev]);

    // Debug: Log para verificar qué se está pasando
    console.log('🔍 Debugging auto-transcription check:');
    console.log('   Type:', memoryData.type);
    console.log('   Has metadata:', !!memoryData.metadata);
    console.log('   Has youtube metadata:', !!memoryData.metadata?.youtube);
    console.log('   Video ID:', memoryData.metadata?.youtube?.videoId);
    console.log('   Enable transcription:', memoryData.metadata?.youtube?.enableTranscription);
    
    // Si es un video de YouTube Y el usuario habilitó la transcripción, procesar en background
    if ((memoryData.type === 'video' || memoryData.type === 'document') && 
        memoryData.metadata?.youtube?.videoId && 
        memoryData.metadata?.youtube?.enableTranscription) {
      console.log('🎥 Detectado video de YouTube, programando procesamiento...');
      console.log('📹 Video ID:', memoryData.metadata.youtube.videoId);
      console.log('📝 Título:', memoryData.title);
      
      // Delay para asegurar que la memoria se guarde en la base de datos
      console.log('⏳ Programando procesamiento para dentro de 5 segundos...');
      setTimeout(async () => {
        console.log('⏰ Ejecutando procesamiento después del delay...');
        // Si no tenemos ID del insert, buscar la memoria por título
        let memoryId = data && data.id ? data.id : null;
        
        if (!memoryId) {
          console.log('🔍 Buscando memoria recién creada por título...');
          try {
            const { data: foundMemories } = await supabase
              .from('memories')
              .select('id')
              .eq('title', memoryData.title)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (foundMemories && foundMemories.length > 0) {
              memoryId = foundMemories[0].id;
              console.log('✅ Memoria encontrada:', memoryId);
            }
          } catch (error) {
            console.error('❌ Error buscando memoria:', error);
          }
        }
        
        if (memoryId) {
          processVideoInBackground(memoryId, memoryData.metadata.youtube.videoId, memoryData.title);
        } else {
          console.error('❌ No se pudo encontrar el ID de la memoria para procesar');
        }
      }, 5000); // Esperar 5 segundos para debugging
    }
    
    return data;
  };

  const checkForDuplicateYouTubeVideo = useCallback(async (url: string, metadata?: any) => {
    if (!user) return null;

    // Extract video ID from URL
    const videoId = extractVideoId(url) || metadata?.youtube?.videoId;
    if (!videoId) return null;

    try {
      // Optimized approach: Search by video ID patterns in URL first
      const { data: urlMatches, error: urlError } = await supabase
        .from('memories')
        .select('id, title, url')
        .eq('user_id', user.id)
        .eq('type', 'video')
        .like('url', `%${videoId}%`)
        .limit(1);

      if (urlError) throw urlError;

      // If found a URL match, verify it's actually the same video
      if (urlMatches && urlMatches.length > 0) {
        const match = urlMatches.find(memory => 
          memory.url && extractVideoId(memory.url) === videoId
        );
        if (match) return match;
      }

      // Fallback: Check metadata (only if no URL match found)
      // This is more expensive but needed for videos saved with metadata
      const { data: metadataMatches, error: metadataError } = await supabase
        .from('memories')
        .select('id, title, metadata')
        .eq('user_id', user.id)
        .eq('type', 'video')
        .not('metadata', 'is', null)
        .limit(20); // Limit to recent videos with metadata

      if (metadataError) throw metadataError;

      const metadataMatch = metadataMatches?.find(memory => 
        memory.metadata?.youtube?.videoId === videoId
      );

      return metadataMatch || null;

    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return null;
    }
  }, [user]);

  // Helper function to extract YouTube video ID
  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('memories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setMemories(prev => prev.map(memory => 
      memory.id === id ? { ...memory, ...data } : memory
    ));
    return data;
  };

  const deleteMemory = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Remove from local state
    setMemories(prev => prev.filter(memory => memory.id !== id));
  };

  // Procesar video en background (transcripción + resumen IA)
  const processVideoInBackground = async (memoryId: string, videoId: string, videoTitle: string, retryCount = 0) => {
    try {
      console.log(`🎬 Starting background processing for: ${videoTitle}`);
      
      console.log('🌐 Making fetch request to /api/process-video...');
      
      const requestData = {
        memoryId,
        videoId,
        videoTitle,
      };
      
      console.log('📤 Datos que se enviarán:', requestData);
      
      // Add AbortController to handle HMR cancellations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const requestBody = JSON.stringify(requestData);
      console.log('📦 JSON body:', requestBody);
      
      // Log the full URL being used
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const fullUrl = `${baseUrl}/api/process-video`;
      console.log('🌍 Full URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📦 Parsed result:', result);

      if (result.success) {
        console.log(`✅ Video processing completed:`, result.summary);
        // Refrescar memorias para mostrar la transcripción actualizada
        fetchMemories();
      } else {
        console.error(`❌ Video processing failed:`, result.error);
        console.error(`❌ Full error details:`, result);
        alert(`Video processing failed: ${result.error}`);
      }
    } catch (error) {
      // Check if error is due to HMR or abort
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        console.log('🔄 Video processing was cancelled due to Hot Module Reload');
        return; // Don't show error for HMR cancellations
      }

      // Retry once if it's a fetch error (likely HMR interference)
      if (error instanceof Error && error.message.includes('Failed to fetch') && retryCount === 0) {
        console.log('🔄 Retrying video processing after HMR interference...');
        setTimeout(() => {
          processVideoInBackground(memoryId, videoId, videoTitle, 1);
        }, 2000); // Wait 2 seconds before retry
        return;
      }

      console.error('Error in background video processing:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown type',
        error: error
      });
      
      // Only show alert for real errors after retry
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      if (retryCount > 0) {
        alert(`Network error during video processing: ${errorMessage}`);
      } else {
        console.log('🔄 Suppressing "Failed to fetch" error in development (likely HMR interference)');
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchMemories();
    } else {
      setMemories([]);
    }
  }, [user]);

  return {
    memories,
    loading,
    createMemory,
    updateMemory,
    deleteMemory,
    refetch: fetchMemories,
    checkForDuplicateYouTubeVideo,
    processVideoInBackground,
  };
}