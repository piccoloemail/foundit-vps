// YouTube URL detection and ID extraction utilities

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  thumbnailUrl: string;
  embedUrl: string;
}

/**
 * Detects if a URL is a YouTube video URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)/i;
  return youtubeRegex.test(url);
}

/**
 * Extracts video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Remove whitespace and convert to lowercase for matching
  const cleanUrl = url.trim();

  // Regular expressions for different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generates YouTube video info from URL
 */
export function getYouTubeVideoInfo(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) return null;

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

/**
 * Validates that a YouTube video ID is properly formatted
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  if (!videoId) return false;
  
  // YouTube video IDs are typically 11 characters long
  // and contain letters, numbers, hyphens, and underscores
  const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
  return videoIdRegex.test(videoId);
}

/**
 * Gets different thumbnail sizes for a YouTube video
 */
export function getYouTubeThumbnails(videoId: string) {
  if (!isValidYouTubeVideoId(videoId)) return null;

  const baseUrl = `https://img.youtube.com/vi/${videoId}`;
  
  return {
    default: `${baseUrl}/default.jpg`,      // 120x90
    medium: `${baseUrl}/mqdefault.jpg`,     // 320x180
    high: `${baseUrl}/hqdefault.jpg`,       // 480x360
    standard: `${baseUrl}/sddefault.jpg`,   // 640x480
    maxres: `${baseUrl}/maxresdefault.jpg`, // 1280x720
  };
}

/**
 * Creates a clean YouTube URL from video ID
 */
export function createYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// Common YouTube URL patterns for testing
export const YOUTUBE_URL_EXAMPLES = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/v/dQw4w9WgXcQ',
  'www.youtube.com/watch?v=dQw4w9WgXcQ',
  'youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
];