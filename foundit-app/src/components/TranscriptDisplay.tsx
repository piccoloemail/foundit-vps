'use client';

import { useState, useEffect } from 'react';
import { Memory } from '@/lib/supabase';

interface TranscriptDisplayProps {
  memory: Memory;
}

export default function TranscriptDisplay({ memory }: TranscriptDisplayProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  
  const youtube = memory.metadata?.youtube;
  
  if (!youtube || (!youtube.transcript && !youtube.aiSummary)) {
    return null;
  }

  const hasTranscript = youtube.transcript && youtube.transcript.length > 0;
  const hasSummary = youtube.aiSummary;
  const isProcessing = memory.type === 'video' && !hasTranscript && !hasSummary;


  return (
    <div className="transcript-display">
      {/* Processing indicator */}
      {isProcessing && (
        <div className="processing-indicator">
          <span className="processing-icon">🤖</span>
          <span className="processing-text">Processing video transcript...</span>
        </div>
      )}

      {/* AI Summary */}
      {hasSummary && (
        <div className="ai-summary">
          <div className="summary-header">
            <span className="summary-icon">🧠</span>
            <span className="summary-label">AI Summary</span>
          </div>
          
          <div className="summary-content">
            <div className="main-topic">
              <strong>Topic:</strong> {youtube.aiSummary.mainTopic}
            </div>
            
            <div className="summary-description">
              {youtube.aiSummary.summary}
            </div>

            {youtube.aiSummary.toolsMentioned && youtube.aiSummary.toolsMentioned.length > 0 && (
              <div className="tools-mentioned">
                <strong>Tools mentioned:</strong>
                <div className="tools-list">
                  {youtube.aiSummary.toolsMentioned.map((tool, index) => (
                    <span key={index} className="tool-tag">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {youtube.aiSummary.keyConcepts && youtube.aiSummary.keyConcepts.length > 0 && (
              <div className="concepts-mentioned">
                <strong>Key concepts:</strong>
                <div className="concepts-list">
                  {youtube.aiSummary.keyConcepts.map((concept, index) => (
                    <span key={index} className="concept-tag">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript toggle */}
      {hasTranscript && (
        <div className="transcript-section">
          <button 
            className="transcript-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setShowTranscript(!showTranscript);
            }}
            style={{
              cursor: 'pointer',
              position: 'relative',
              zIndex: 10,
              display: 'block',
              width: '100%',
              pointerEvents: 'auto',
            }}
          >
            <span className="transcript-icon">📝</span>
            <span className="transcript-label">
              {showTranscript ? 'Hide' : 'Show'} Transcript ({youtube.transcriptLanguage?.toUpperCase()})
            </span>
            <span className="transcript-arrow">
              {showTranscript ? '▼' : '▶'}
            </span>
          </button>

          {showTranscript && (
            <div className="transcript-content">
              <div className="transcript-meta">
                <span className="transcript-length">
                  {Math.round(youtube.transcript.length / 1000)}k characters
                </span>
                <span className="transcript-source">
                  Source: {youtube.transcriptSource === 'youtube_api' ? 'YouTube' : 'Whisper AI'}
                </span>
              </div>
              
              <div 
                className="transcript-text"
                style={{
                  maxHeight: '300px',
                  overflowY: 'scroll',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  MozUserSelect: 'text',
                  cursor: 'text',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  lineHeight: '1.6',
                  fontSize: '0.875rem',
                  position: 'relative',
                  zIndex: 1000,
                  pointerEvents: 'auto',
                  isolation: 'isolate',
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Show segments with clickable timestamps if available */}
                {youtube.segments && youtube.segments.length > 0 ? (
                  <div className="transcript-segments">
                    {youtube.segments.map((segment: any, index: number) => (
                      <div key={index} className="transcript-segment" style={{ marginBottom: '0.5rem' }}>
                        <button
                          className="timestamp-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Extract video ID from URL
                            const videoId = memory.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
                            if (videoId) {
                              // Handle different timestamp formats
                              let totalSeconds = 0;
                              
                              // Remove any decimals first (e.g., "2:30.5" -> "2:30")
                              const cleanTimestamp = segment.startTime.split('.')[0];
                              const parts = cleanTimestamp.split(':');
                              
                              if (parts.length === 2) {
                                // Format: "MM:SS"
                                const [minutes, seconds] = parts.map(Number);
                                totalSeconds = minutes * 60 + seconds;
                              } else if (parts.length === 3) {
                                // Format: "HH:MM:SS"
                                const [hours, minutes, seconds] = parts.map(Number);
                                totalSeconds = hours * 3600 + minutes * 60 + seconds;
                              }
                              
                              const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}&t=${totalSeconds}s`;
                              window.open(youtubeUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                            }
                          }}
                          style={{
                            background: 'var(--accent)',
                            color: 'var(--text-primary)',
                            border: 'none',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            marginRight: '8px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {segment.startTime}
                        </button>
                        <span style={{ userSelect: 'text' }}>{segment.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback to timestamped text if no segments */
                  <div style={{ whiteSpace: 'pre-wrap' }}>{youtube.transcriptWithTimestamps || youtube.transcript}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No data available */}
      {!isProcessing && !hasTranscript && !hasSummary && (
        <div className="no-transcript">
          <span className="no-transcript-icon">❌</span>
          <span className="no-transcript-text">
            No transcript available for this video
          </span>
        </div>
      )}
    </div>
  );
}