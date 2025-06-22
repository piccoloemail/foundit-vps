'use client';

import { useState, useEffect } from 'react';
import { isYouTubeUrl, getYouTubeVideoInfo, YouTubeVideoInfo } from '@/utils/youtube';
import { fetchYouTubeMetadata, YouTubeVideoMetadata } from '@/utils/youtubeApi';

interface YouTubePreviewProps {
  url: string;
  onVideoInfoExtracted?: (info: YouTubeVideoInfo, metadata?: YouTubeVideoMetadata) => void;
}

export default function YouTubePreview({ url, onVideoInfoExtracted }: YouTubePreviewProps) {
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [metadata, setMetadata] = useState<YouTubeVideoMetadata | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  useEffect(() => {
    if (isYouTubeUrl(url)) {
      const info = getYouTubeVideoInfo(url);
      if (info) {
        setVideoInfo(info);
        
        // Fetch video metadata
        setLoadingMetadata(true);
        fetchYouTubeMetadata(info.videoId)
          .then((meta) => {
            setMetadata(meta);
            onVideoInfoExtracted?.(info, meta || undefined);
          })
          .catch((error) => {
            console.error('Failed to fetch YouTube metadata:', error);
            onVideoInfoExtracted?.(info);
          })
          .finally(() => {
            setLoadingMetadata(false);
          });
      }
    } else {
      setVideoInfo(null);
      setMetadata(null);
    }
  }, [url]); // Removed onVideoInfoExtracted from dependencies

  if (!videoInfo) return null;

  return (
    <div className="youtube-preview">
      <div className="youtube-preview-header">
        <span className="youtube-icon">📺</span>
        <span className="youtube-label">YouTube Video Detected</span>
      </div>
      
      <div className="youtube-preview-content">
        <div className="youtube-thumbnail">
          {!imageError ? (
            <img
              src={videoInfo.thumbnailUrl}
              alt="YouTube video thumbnail"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                // Fallback to a smaller thumbnail
                const fallbackSrc = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
                (event.target as HTMLImageElement).src = fallbackSrc;
              }}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '6px',
                opacity: imageLoaded ? 1 : 0.5,
              }}
            />
          ) : (
            <div className="youtube-thumbnail-fallback">
              <span>📺</span>
              <span>YouTube Video</span>
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="youtube-play-overlay">
            <div className="youtube-play-button">▶</div>
          </div>
        </div>
        
        <div className="youtube-info">
          {loadingMetadata ? (
            <div className="youtube-loading">
              <span>🔄</span>
              <span>Loading video details...</span>
            </div>
          ) : metadata ? (
            <>
              <div className="youtube-title">
                <strong>{metadata.title}</strong>
              </div>
              <div className="youtube-channel">
                📺 {metadata.channelTitle}
              </div>
              {metadata.description ? (
                <div className="youtube-description">
                  {metadata.description.length > 150 
                    ? `${metadata.description.substring(0, 150)}...`
                    : metadata.description
                  }
                </div>
              ) : (
                <div className="youtube-note">
                  ℹ️ Video description requires YouTube Data API v3 key
                </div>
              )}
              <div className="youtube-video-id">
                Video ID: <code>{videoInfo.videoId}</code>
              </div>
            </>
          ) : (
            <div className="youtube-video-id">
              Video ID: <code>{videoInfo.videoId}</code>
            </div>
          )}
        </div>
      </div>
      
      <div className="youtube-preview-note">
        <span>💡</span>
        <span>Video metadata will be automatically extracted when saved</span>
      </div>
    </div>
  );
}