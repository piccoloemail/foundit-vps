import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { memoryId, youtubeUrl } = await request.json();
    
    // Opción 1: Usar Deepgram (más barato)
    console.log('🎙️ Attempting Deepgram transcription...');
    
    const deepgramResponse = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=es,en',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: youtubeUrl
        })
      }
    );
    
    if (deepgramResponse.ok) {
      const result = await deepgramResponse.json();
      const transcript = result.results.channels[0].alternatives[0].transcript;
      
      // Actualizar Supabase
      const { error } = await supabase
        .from('memories')
        .update({
          metadata: {
            youtube: {
              transcript,
              transcriptSource: 'deepgram',
              transcriptLanguage: result.results.channels[0].detected_language || 'en',
              transcribedAt: new Date().toISOString()
            }
          }
        })
        .eq('id', memoryId);
      
      if (error) throw error;
      
      return NextResponse.json({ 
        success: true, 
        source: 'deepgram',
        transcript: transcript.substring(0, 100) + '...'
      });
    }
    
    // Opción 2: Fallback a otro servicio
    // ...
    
    return NextResponse.json({ 
      success: false, 
      error: 'No transcription service available' 
    }, { status: 500 });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Función para llamar desde el frontend
export async function requestExternalTranscription(memoryId: string, youtubeUrl: string) {
  try {
    // Llamar en background - no bloquear UI
    fetch('/api/process-transcript-external', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryId, youtubeUrl })
    }).catch(console.error);
    
    // Retornar inmediatamente
    return { queued: true };
  } catch (error) {
    console.error('Failed to queue transcription:', error);
    return { queued: false, error };
  }
}