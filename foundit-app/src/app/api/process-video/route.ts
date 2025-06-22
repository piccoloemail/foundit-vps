import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processVideo } from '@/utils/transcriptApi';

// Crear cliente de Supabase para el servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    console.log('🎬 API endpoint hit!');
    console.log('🌐 Request URL:', request.url);
    console.log('🔧 Request method:', request.method);
    
    // Verificar si el request tiene contenido
    const contentLength = request.headers.get('content-length');
    console.log('📏 Content-Length:', contentLength);
    
    if (!contentLength || contentLength === '0') {
      console.error('❌ Request body is empty');
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400, headers }
      );
    }
    
    let body;
    try {
      body = await request.json();
      console.log('📦 Request body:', body);
    } catch (jsonError) {
      console.error('❌ Error parsing JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers }
      );
    }
    
    const { memoryId, videoId, videoTitle } = body;
    
    if (!memoryId || !videoId || !videoTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: memoryId, videoId, videoTitle' },
        { status: 400, headers }
      );
    }

    console.log(`🎬 Processing video: ${videoTitle} (${videoId}) for memory ${memoryId}`);
    
    // Verificar que la memoria existe con reintentos para timing de DB
    let memory = null;
    let memoryError = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !memory) {
      if (retryCount > 0) {
        console.log(`🔄 Retry ${retryCount}/${maxRetries} - waiting for memory to be available...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
      
      const result = await supabase
        .from('memories')
        .select('id, metadata, user_id')
        .eq('id', memoryId)
        .maybeSingle();
        
      memory = result.data;
      memoryError = result.error;
      retryCount++;
      
      if (memory) {
        console.log(`✅ Memory found on attempt ${retryCount}`);
        break;
      }
    }

    if (memoryError) {
      console.error('Database error:', memoryError);
      return NextResponse.json(
        { error: 'Database error', details: memoryError.message },
        { status: 500, headers }
      );
    }

    if (!memory) {
      console.error(`Memory ${memoryId} not found after ${maxRetries} attempts`);
      return NextResponse.json(
        { error: 'Memory not found after retries' },
        { status: 404, headers }
      );
    }

    console.log(`✅ Memory found, starting video processing...`);

    // Procesar video (transcripción + resumen IA)
    const processingResult = await processVideo(videoId, videoTitle);

    if (!processingResult.success) {
      console.error('Video processing failed:', processingResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to process video', 
          details: processingResult.error 
        },
        { status: 500, headers }
      );
    }

    console.log(`🤖 Video processing completed, updating memory...`);

    // Actualizar metadata en Supabase
    const updatedMetadata = {
      ...memory.metadata,
      youtube: {
        ...memory.metadata?.youtube,
        transcript: processingResult.transcript,
        transcriptWithTimestamps: processingResult.transcriptWithTimestamps,
        segments: processingResult.segments, // Guardar segmentos con timestamps
        transcriptLanguage: processingResult.transcriptLanguage,
        transcriptSource: processingResult.transcriptSource,
        aiSummary: processingResult.aiSummary,
        hasTranscript: processingResult.hasTranscript,
        processedAt: processingResult.processedAt
      }
    };

    const { error: updateError } = await supabase
      .from('memories')
      .update({ metadata: updatedMetadata })
      .eq('id', memoryId);

    if (updateError) {
      console.error('Error updating memory:', updateError);
      return NextResponse.json(
        { error: 'Failed to save processing results' },
        { status: 500, headers }
      );
    }

    console.log(`✅ Memory updated successfully!`);

    return NextResponse.json({
      success: true,
      message: 'Video processed successfully',
      summary: {
        mainTopic: processingResult.aiSummary?.mainTopic,
        toolsFound: processingResult.aiSummary?.toolsMentioned?.length || 0,
        conceptsFound: processingResult.aiSummary?.keyConcepts?.length || 0,
        transcriptLength: processingResult.transcript?.length || 0
      }
    }, { headers });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500, headers }
    );
  }
}