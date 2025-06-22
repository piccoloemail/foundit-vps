import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAISummary } from '../../../utils/transcriptApi';

// Crear cliente de Supabase para el servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers });
}

export async function POST(request: NextRequest) {
  try {
    const { memoryId, transcript, videoTitle } = await request.json();
    
    if (!memoryId || !transcript || !videoTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: memoryId, transcript, videoTitle' },
        { status: 400, headers }
      );
    }

    console.log('📝 Processing manual transcript for:', videoTitle);

    // Generar resumen AI del transcript manual
    const aiSummary = await generateAISummary(transcript, videoTitle, 'es');

    // Primero obtener la memoria existente para preservar metadata
    const { data: existingMemory, error: fetchError } = await supabase
      .from('memories')
      .select('metadata')
      .eq('id', memoryId)
      .single();

    if (fetchError) {
      console.error('Error fetching memory:', fetchError);
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404, headers }
      );
    }

    // Actualizar la memoria preservando metadata existente
    const updatedMetadata = {
      ...existingMemory.metadata,
      youtube: {
        ...existingMemory.metadata?.youtube,
        transcript,
        transcriptSource: 'manual',
        transcriptLanguage: 'es',
        hasTranscript: true,
        aiSummary,
        processedAt: new Date().toISOString()
      }
    };

    const { data, error } = await supabase
      .from('memories')
      .update({ metadata: updatedMetadata })
      .eq('id', memoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating memory:', error);
      return NextResponse.json(
        { error: 'Failed to update memory with transcript' },
        { status: 500, headers }
      );
    }

    console.log('✅ Manual transcript processed successfully');

    return NextResponse.json({
      success: true,
      data: {
        transcript,
        aiSummary,
        processedAt: new Date().toISOString()
      }
    }, { headers });

  } catch (error) {
    console.error('Error processing manual transcript:', error);
    return NextResponse.json(
      { error: 'Failed to process transcript' },
      { status: 500, headers }
    );
  }
}