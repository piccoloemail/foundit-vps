// N8N Transcript Integration
// Calls local N8N workflow to get YouTube transcripts

export interface N8NTranscriptResponse {
  transcript?: string;
  transcriptWithTimestamps?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  status: string;
  error?: string;
  video_id?: string;
  youtube_url?: string;
}

export async function requestN8NTranscript(
  youtubeUrl: string,
  memoryId: string
): Promise<N8NTranscriptResponse> {
  try {
    console.log('[N8N] ============================================');
    console.log('[N8N] Starting N8N transcript request');
    console.log('[N8N] YouTube URL:', youtubeUrl);
    console.log('[N8N] Memory ID:', memoryId);
    console.log('[N8N] Webhook URL: http://localhost:5678/webhook/youtube-transcript');
    console.log('[N8N] ============================================');
    
    // Call N8N webhook (Local mode)
    const response = await fetch(
      'http://localhost:5678/webhook/youtube-transcript',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          memory_id: memoryId,
          user_id: 'system', // Optional, for tracking
          video_title: 'Processing' // Optional
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[N8N] Error response body:', errorText);
      throw new Error(`N8N webhook failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[N8N] Response received:', data);
    
    // Si está en retry, esperar y volver a intentar
    if (data.retry || data.status === 'processing') {
      console.log('[N8N] Transcript still processing, waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Esperar 60 segundos
      
      // Intentar una vez más
      return await requestN8NTranscript(youtubeUrl, memoryId);
    }
    
    return data;
  } catch (error) {
    console.error('[N8N] Transcript request failed:', error);
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper to format transcript with timestamps for FoundIt.at
export function formatTranscriptForDisplay(
  transcript: string,
  segments?: Array<{ start: number; end: number; text: string }>
): string {
  if (!segments || segments.length === 0) {
    return transcript;
  }

  // Format with timestamps
  return segments.map(segment => {
    const minutes = Math.floor(segment.start / 60);
    const seconds = Math.floor(segment.start % 60);
    const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return `${timestamp}\n${segment.text}`;
  }).join('\n\n');
}