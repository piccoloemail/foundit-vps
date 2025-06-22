'use client';

import { SearchContext } from '@/hooks/useSearch';

interface SearchContextBannerProps {
  context: SearchContext;
  className?: string;
}

const getContextIcon = (foundIn: string) => {
  const iconMap: Record<string, string> = {
    title: '📄',
    content: '📝',
    transcript: '🎙️',
    ai_summary: '🧠',
    tags: '🏷️',
    url: '🔗'
  };
  return iconMap[foundIn] || '🔍';
};

const getContextLabel = (foundIn: string) => {
  const labelMap: Record<string, string> = {
    title: 'Title',
    content: 'Description',
    transcript: 'Transcript',
    ai_summary: 'AI Summary',
    tags: 'Tags',
    url: 'URL'
  };
  return labelMap[foundIn] || 'Found';
};

export default function SearchContextBanner({ context, className = '' }: SearchContextBannerProps) {
  
  // Debug: Log context data to see what we're getting
  console.log('🔍 SearchContextBanner received:', {
    foundIn: context.foundIn,
    snippetsCount: context.snippets.length,
    snippets: context.snippets.map((s, index) => ({
      index,
      snippet: s.snippet.substring(0, 40) + '...',
      timestamp: s.timestamp,
      hasTimestamp: !!s.timestamp,
      timestampType: typeof s.timestamp
    }))
  });
  
  // Special focus on transcript matches
  if (context.foundIn === 'transcript') {
    console.log('🎙️ TRANSCRIPT DETAILS:');
    context.snippets.forEach((snippet, index) => {
      console.log(`   Snippet ${index}:`, {
        text: snippet.snippet.substring(0, 50) + '...',
        timestamp: snippet.timestamp,
        hasTimestamp: !!snippet.timestamp,
        allKeys: Object.keys(snippet)
      });
    });
  }
  
  const handleJumpToTimestamp = (timestamp?: string) => {
    // Always try to open video, even without timestamp
    if (context.memory.url) {
      // Extract video ID from URL
      const videoId = context.memory.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        let youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Add timestamp if available
        if (timestamp) {
          console.log('🔍 Debug timestamp conversion:');
          console.log('   Original timestamp:', timestamp);
          
          // Handle different timestamp formats
          let totalSeconds = 0;
          
          // Remove any decimals first (e.g., "2:30.5" -> "2:30")
          const cleanTimestamp = timestamp.split('.')[0];
          const parts = cleanTimestamp.split(':');
          
          if (parts.length === 2) {
            // Format: "MM:SS"
            const [minutes, seconds] = parts.map(Number);
            totalSeconds = minutes * 60 + seconds;
            console.log(`   Format MM:SS - Minutes: ${minutes}, Seconds: ${seconds}`);
          } else if (parts.length === 3) {
            // Format: "HH:MM:SS"
            const [hours, minutes, seconds] = parts.map(Number);
            totalSeconds = hours * 3600 + minutes * 60 + seconds;
            console.log(`   Format HH:MM:SS - Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}`);
          } else {
            console.warn('   Unknown timestamp format, defaulting to 0');
            totalSeconds = 0;
          }
          
          console.log('   Total seconds:', totalSeconds);
          youtubeUrl += `&t=${totalSeconds}s`;
          console.log('   Final URL:', youtubeUrl);
        }
        
        window.open(youtubeUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      }
    }
  };


  return (
    <div 
      className={`search-context-banner ${className}`}
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px',
        fontSize: '0.875rem',
        position: 'relative',
        zIndex: 5
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontSize: '1rem' }}>
          {getContextIcon(context.foundIn)}
        </span>
        <div style={{ flex: 1 }}>
          {/* Header with match count */}
          <div style={{ 
            fontWeight: 'bold', 
            color: 'var(--accent)', 
            marginBottom: '8px'
          }}>
            🔍 Found in: {getContextLabel(context.foundIn)}
            {context.snippets.length > 1 && (
              <span style={{
                background: 'var(--accent)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                marginLeft: '8px'
              }}>
                {context.snippets.length} matches
              </span>
            )}
          </div>

          {/* All snippets (show each with timestamp inline) */}
          <div style={{ marginBottom: '8px' }}>
            {context.snippets.map((snippet, index) => (
              <div key={index} style={{ 
                marginBottom: index < context.snippets.length - 1 ? '12px' : '8px',
                paddingBottom: index < context.snippets.length - 1 ? '8px' : '0',
                borderBottom: index < context.snippets.length - 1 ? '1px solid var(--border-light)' : 'none'
              }}>
                <div style={{ 
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4',
                  marginBottom: '8px',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ flex: 1 }}>"{snippet.snippet}"</span>
                  {snippet.timestamp ? (
                    <button
                      onClick={() => handleJumpToTimestamp(snippet.timestamp)}
                      style={{
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      title={`Jump to ${snippet.timestamp}`}
                    >
                      ▶️ {snippet.timestamp}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJumpToTimestamp()}
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      title="Open video (no timestamp available)"
                    >
                      ▶️ Video
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}