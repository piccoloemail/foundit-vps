'use client';

import { useState } from 'react';
import { Memory } from '@/lib/supabase';
import TranscriptDisplay from './TranscriptDisplay';

interface MemoryCardProps {
  memory: Memory;
  onEditMemory: (memory: Memory) => void;
}

const getTypeEmoji = (type: string) => {
  const typeMap: Record<string, string> = {
    link: '🔗',
    text: '📝',
    video: '📺',
    image: '📸',
    document: '📄',
    note: '💡',
  };
  return typeMap[type] || '📄';
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

export default function MemoryCard({ memory, onEditMemory }: MemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isYouTube = (memory.type === 'video' || memory.type === 'document' || memory.type === 'link') && memory.metadata?.youtube;

  const handleToggle = () => {
    console.log('[MemoryCard] Toggling expansion for:', memory.id);
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`memory-card ${isYouTube ? 'youtube-memory' : ''}`}>
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
        <span className="memory-type">
          {getTypeEmoji(memory.type)} {memory.type}
        </span>
        {memory.category && (
          <span className="memory-type" style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>
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
      
      <h3 className="memory-title">{memory.title}</h3>
      
      {/* Content/Description */}
      {memory.content && (
        <p className="memory-content">
          {memory.content.length > 150 
            ? `${memory.content.substring(0, 150)}...` 
            : memory.content
          }
        </p>
      )}
      
      {memory.url && (
        <a 
          href={memory.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="memory-url"
          onClick={(e) => e.stopPropagation()}
        >
          {memory.url.length > 50 
            ? `${memory.url.substring(0, 50)}...` 
            : memory.url
          }
        </a>
      )}

      {/* Accordion Toggle for YouTube videos with rich content */}
      {isYouTube && (memory.metadata.youtube.aiSummary || memory.metadata.youtube.transcript) && (
        <button 
          className="accordion-toggle"
          onClick={handleToggle}
          style={{
            backgroundColor: isExpanded ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: isExpanded ? 'white' : 'var(--text-primary)',
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
}