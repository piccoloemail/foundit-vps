'use client';

import { useState, useEffect } from 'react';
import { Memory } from '@/lib/supabase';
import { SearchContext } from '@/hooks/useSearch';
import TranscriptDisplay from './TranscriptDisplay';
import SearchContextBanner from './SearchContextBanner';

interface MemoryListProps {
  memories: Memory[];
  loading: boolean;
  onEditMemory: (memory: Memory) => void;
  isSearchResult?: boolean;
  searchQuery?: string;
  searchContexts?: SearchContext[];
  isListView?: boolean;
}

const getTypeEmoji = (type: string) => {
  const typeMap: Record<string, string> = {
    link: '🌐',
    text: '📝',
    video: '📺',
    image: '📸',
    document: '📄',
    note: '📝',
  };
  return typeMap[type] || '📄';
};

const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    link: 'WEBSITE',
    text: 'TEXT',
    video: 'VIDEO',
    image: 'IMAGE',
    document: 'DOCUMENT',
    note: 'NOTE',
  };
  return labelMap[type] || type.toUpperCase();
};

const getTypeStyles = (type: string) => {
  const styleMap: Record<string, { backgroundColor: string; color: string }> = {
    video: {
      backgroundColor: '#ff0000',
      color: 'white'
    },
    note: {
      backgroundColor: '#fbbf24', // Yellow
      color: '#1f2937' // Dark text for contrast
    },
    link: {
      backgroundColor: '#10b981', // Green
      color: 'white'
    },
    document: {
      backgroundColor: '#3b82f6', // Blue
      color: 'white'
    },
    text: {
      backgroundColor: '#8b5cf6', // Purple
      color: 'white'
    },
    image: {
      backgroundColor: '#ec4899', // Pink
      color: 'white'
    }
  };
  return styleMap[type] || { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const truncateDescription = (text: string, maxLength: number = 150) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function MemoryList({ memories, loading, onEditMemory, isSearchResult, searchQuery, searchContexts = [], isListView }: MemoryListProps) {
  // State to track which video cards are expanded - using array instead of Set for better serialization
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log('[MemoryList] Component mounted, isClient set to true');
  }, []);

  const toggleCardExpansion = (memoryId: string) => {
    console.log('[MemoryList] Toggle clicked for memory:', memoryId);
    console.log('[MemoryList] Current expanded cards:', expandedCards);
    
    setExpandedCards(prev => {
      const isExpanded = prev.includes(memoryId);
      let newCards;
      if (isExpanded) {
        newCards = prev.filter(id => id !== memoryId);
      } else {
        newCards = [...prev, memoryId];
      }
      console.log('[MemoryList] New expanded cards:', newCards);
      return newCards;
    });
  };
  
  // Helper function to check if a card is expanded
  const isCardExpanded = (memoryId: string) => {
    return expandedCards.includes(memoryId);
  };

  // Helper function to get search context for a memory
  const getSearchContext = (memoryId: string): SearchContext | undefined => {
    return searchContexts.find(context => context.memory.id === memoryId);
  };
  if (loading) {
    return (
      <div className="text-center">
        <div className="empty-icon">🧠</div>
        <p>Loading your memories...</p>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">{isSearchResult ? '🔍' : '🧠'}</div>
        <h2 className="empty-title">
          {isSearchResult ? 'No matches found' : 'No memories found'}
        </h2>
        <p className="empty-subtitle">
          {isSearchResult 
            ? `No memories match "${searchQuery}". Try a different search or clear filters.`
            : 'Start saving your first memory using the button above!'}
        </p>
      </div>
    );
  }

  if (isListView) {
    // List View - Compact list with expandable content
    return (
      <div className="memories-list">
        {memories.map((memory) => {
          const isYouTube = (memory.type === 'video' || memory.type === 'document' || memory.type === 'link') && memory.metadata?.youtube;
          const isExpanded = isCardExpanded(memory.id);
          const searchContext = getSearchContext(memory.id);
          
          return (
            <div key={memory.id} className="memory-list-item">
              {/* Search Context Banner */}
              {searchContext && (
                <SearchContextBanner context={searchContext} />
              )}
              <div className="memory-list-content">
                <div className="memory-list-header">
                  <span 
                    className="memory-type-badge"
                    style={{
                      ...getTypeStyles(memory.type),
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.05em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginRight: '0.5rem'
                    }}
                  >
                    {getTypeEmoji(memory.type)} {getTypeLabel(memory.type)}
                  </span>
                  <h3 
                    className="memory-list-title clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCardExpansion(memory.id);
                    }}
                  >
                    {memory.title}
                    <span className={`list-accordion-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
                  </h3>
                  <div className="memory-list-meta">
                    <span className="memory-date">{formatDate(memory.created_at)}</span>
                    {memory.category && (
                      <span className="memory-category">{memory.category}</span>
                    )}
                    {isYouTube && memory.metadata.youtube.aiSummary && (
                      <span className="ai-indicator">🧠 AI</span>
                    )}
                  </div>
                </div>
                
                <div className="memory-list-actions">
                  <button 
                    className="list-edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMemory(memory);
                    }}
                    title="Edit memory"
                  >
                    ✏️
                  </button>
                  {memory.url && (
                    <button 
                      className="list-open-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        memory.url && window.open(memory.url, '_blank');
                      }}
                      title="Open link"
                    >
                      🔗
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content for List View */}
              {isExpanded && (
                <div className="list-accordion-content">
                  {/* URL Display */}
                  {memory.url && (
                    <div className="list-url-section">
                      <strong>URL:</strong>
                      <a 
                        href={memory.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="list-url-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {memory.url}
                      </a>
                    </div>
                  )}

                  {/* Content/Description */}
                  {memory.content && (
                    <div className="list-content-section">
                      <strong>Description:</strong>
                      <p className="list-content-text">{memory.content}</p>
                    </div>
                  )}

                  {/* YouTube Thumbnail for videos */}
                  {isYouTube && memory.metadata.youtube.thumbnailUrl && (
                    <div className="list-thumbnail-section">
                      <img 
                        src={memory.metadata.youtube.thumbnailUrl}
                        alt="YouTube video thumbnail"
                        className="list-youtube-thumbnail"
                        onClick={(e) => {
                          e.stopPropagation();
                          memory.url && window.open(memory.url, '_blank');
                        }}
                      />
                    </div>
                  )}

                  {/* Files for documents */}
                  {memory.metadata?.files && memory.metadata.files.length > 0 && (
                    <div className="list-files-section">
                      <strong>Files ({memory.metadata.files.length}):</strong>
                      <div className="list-files-grid">
                        {memory.metadata.files.map((file: any, index: number) => (
                          <div key={index} className="list-file-item">
                            <span className="list-file-icon">
                              {file.fileType === 'image' ? '🖼️' : 
                               file.fileType === 'video' ? '🎥' : 
                               file.fileType === 'document' ? '📄' : '📎'}
                            </span>
                            <span className="list-file-name">{file.name}</span>
                            {file.url && (
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="list-file-download"
                                onClick={(e) => e.stopPropagation()}
                              >
                                ⬇️
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Summary and Transcript for YouTube videos */}
                  {isYouTube && (
                    <div className="list-youtube-section">
                      <TranscriptDisplay memory={memory} />
                    </div>
                  )}

                  {/* Tags */}
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="list-tags-section">
                      <strong>Tags:</strong>
                      <div className="list-tags-container">
                        {memory.tags.map((tag, index) => (
                          <span key={index} className="list-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Card View - Original grid layout
  return (
    <div className="memories-grid">
      {memories.map((memory) => {
        const isYouTube = (memory.type === 'video' || memory.type === 'document' || memory.type === 'link') && memory.metadata?.youtube;
        const isExpanded = isCardExpanded(memory.id);
        const searchContext = getSearchContext(memory.id);
        
        return (
          <div key={memory.id} className={`memory-card ${isYouTube ? 'youtube-memory' : ''}`}>
            {/* Search Context Banner */}
            {searchContext && (
              <SearchContextBanner context={searchContext} />
            )}
            <div className="memory-actions">
              <button 
                className="edit-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMemory(memory);
                }}
                title="Edit memory"
              >
                ✏️ Edit
              </button>
            </div>
            
            <div className="memory-header">
              <span 
                className="memory-type"
                style={{
                  ...getTypeStyles(memory.type),
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {getTypeEmoji(memory.type)} {getTypeLabel(memory.type)}
              </span>
              {memory.category && (
                <span 
                  className="memory-category-badge" 
                  style={{ 
                    backgroundColor: 'var(--accent-primary)', 
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em'
                  }}
                >
                  {memory.category}
                </span>
              )}
            </div>

            {/* YouTube Thumbnail */}
            {isYouTube && memory.metadata.youtube.thumbnailUrl && (
              <img 
                src={memory.metadata.youtube.thumbnailUrl}
                alt="YouTube video thumbnail"
                className="youtube-memory-thumbnail"
                onClick={(e) => {
                  e.stopPropagation();
                  if (memory.url) {
                    window.open(memory.url, '_blank');
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
            )}

            {/* Website Preview - Similar to YouTube Thumbnail */}
            {!isYouTube && memory.metadata?.website && memory.metadata.website.image && (
              <div 
                className="website-thumbnail-wrapper"
                style={{
                  position: 'relative',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  borderRadius: '8px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (memory.url) {
                    window.open(memory.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector('.image-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector('.image-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '0';
                }}
              >
                <img 
                  src={memory.metadata.website.image}
                  alt={memory.metadata.website.title || 'Website preview'}
                  className="website-memory-thumbnail"
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    // Hide the entire wrapper if image fails to load
                    e.currentTarget.parentElement!.style.display = 'none';
                  }}
                />
                {/* Overlay hint on hover */}
                <div 
                  className="image-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'none'
                  }}
                >
                  <span style={{
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    🔗 Open Website
                  </span>
                </div>
              </div>
            )}
            
            <h3 className="memory-title">{memory.title}</h3>
            
            {/* Content/Description - truncated for YouTube videos */}
            {memory.content && (
              <p className="memory-content">
                {isYouTube && !isExpanded 
                  ? truncateDescription(memory.content, 100)
                  : memory.content.length > 150 
                    ? `${memory.content.substring(0, 150)}...` 
                    : memory.content
                }
              </p>
            )}
            
            {memory.url && (
              <div 
                className="memory-url-container"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '0.5rem',
                  position: 'relative',
                  zIndex: 10,
                  pointerEvents: 'auto'
                }}
              >
                <a 
                  href={memory.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="memory-url"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 11,
                    pointerEvents: 'auto'
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  {memory.url}
                </a>
                <button
                  className="copy-url-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    navigator.clipboard.writeText(memory.url || '');
                    // Show a brief "Copied!" message
                    const button = e.currentTarget;
                    const originalText = button.textContent;
                    button.textContent = '✓';
                    setTimeout(() => {
                      button.textContent = originalText;
                    }, 1000);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    zIndex: 12,
                    pointerEvents: 'auto'
                  }}
                  title="Copy URL"
                >
                  📋
                </button>
              </div>
            )}

            {/* Accordion Toggle for YouTube videos with rich content */}
            {isYouTube && (memory.metadata.youtube.aiSummary || memory.metadata.youtube.transcript) && (
              <button 
                className="accordion-toggle"
                data-memory-id={memory.id}
                data-expanded={isExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('[MemoryList] Accordion button clicked');
                  toggleCardExpansion(memory.id);
                }}
                style={{
                  backgroundColor: isExpanded ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: isExpanded ? 'white' : 'var(--text-primary)',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                <span>
                  {memory.metadata.youtube.aiSummary ? 'AI Summary & Details' : 'Video Details'}
                </span>
                <span className={`accordion-arrow ${isExpanded ? 'expanded' : ''}`}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
            )}

            {/* Collapsible Content for YouTube videos */}
            {isYouTube && isExpanded && (
              <div className="accordion-content">
                {/* Transcript Display includes AI Summary and Transcript */}
                <TranscriptDisplay memory={memory} />
              </div>
            )}
            
            {/* Display uploaded files */}
            {memory.metadata?.files && memory.metadata.files.length > 0 && (
              <div className="memory-files">
                <div className="files-header">
                  <span className="files-icon">📎</span>
                  <span className="files-count">{memory.metadata.files.length} file{memory.metadata.files.length > 1 ? 's' : ''}</span>
                </div>
                <div className="files-list">
                  {memory.metadata.files.map((file: any, index: number) => (
                    <div key={index} className="file-item">
                      <span className="file-icon">
                        {file.fileType === 'image' ? '🖼️' : 
                         file.fileType === 'video' ? '🎥' : 
                         file.fileType === 'document' ? '📄' : '📎'}
                      </span>
                      <span className="file-name">{file.name}</span>
                      {file.url && (
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⬇️
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            
            <div className="memory-meta">
              <div>
                {memory.tags && memory.tags.length > 0 && (
                  <div className="memory-tags">
                    {memory.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="memory-tag">
                        {tag}
                      </span>
                    ))}
                    {memory.tags.length > 3 && (
                      <span className="memory-tag">+{memory.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <span>{formatDate(memory.created_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}