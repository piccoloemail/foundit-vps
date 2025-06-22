// YouTube Data API v3 integration

export interface YouTubeVideoMetadata {
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  tags?: string[];
  thumbnails: {
    default: string;
    medium: string;
    high: string;
    standard?: string;
    maxres?: string;
  };
}

/**
 * Fetches video metadata using the best available API
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeVideoMetadata | null> {
  try {
    // Check if YouTube API key is available
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    
    if (apiKey) {
      console.log('Using YouTube Data API v3 for enhanced metadata');
      const result = await fetchYouTubeMetadataWithAPI(videoId, apiKey);
      if (result) return result;
    }

    console.log('Using fallback APIs for basic metadata');
    
    // Try fallback APIs in order of preference
    const fallbackApis = [
      () => fetchFromYouTubeOEmbed(videoId),
      () => fetchFromNoembed(videoId),
    ];

    for (const apiCall of fallbackApis) {
      try {
        const result = await apiCall();
        if (result) return result;
      } catch (error) {
        console.warn('Fallback API failed, trying next:', error);
      }
    }

    throw new Error('All APIs failed');
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return null;
  }
}

/**
 * Fetch from YouTube's official oEmbed API
 */
async function fetchFromYouTubeOEmbed(videoId: string): Promise<YouTubeVideoMetadata | null> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('YouTube oEmbed failed');
  
  const data = await response.json();
  
  return {
    title: data.title || 'Untitled Video',
    description: '', // oEmbed doesn't provide description
    channelTitle: data.author_name || 'Unknown Channel',
    publishedAt: '',
    duration: '',
    viewCount: '',
    tags: [],
    thumbnails: {
      default: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/default.jpg`,
      medium: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      high: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    }
  };
}

/**
 * Fetch from noembed.com as fallback
 */
async function fetchFromNoembed(videoId: string): Promise<YouTubeVideoMetadata | null> {
  const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
  
  if (!response.ok) throw new Error('Noembed failed');
  
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  
  return {
    title: data.title || 'Untitled Video',
    description: '', // noembed doesn't provide description either
    channelTitle: data.author_name || 'Unknown Channel',
    publishedAt: '',
    duration: '',
    viewCount: '',
    tags: [],
    thumbnails: {
      default: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/default.jpg`,
      medium: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      high: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    }
  };
}

/**
 * Alternative method using YouTube Data API v3 (requires API key)
 * This would be the preferred method for production
 */
export async function fetchYouTubeMetadataWithAPI(videoId: string, apiKey: string): Promise<YouTubeVideoMetadata | null> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video metadata from YouTube API');
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }
    
    const video = data.items[0];
    const snippet = video.snippet;
    
    return {
      title: snippet.title,
      description: snippet.description,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      duration: video.contentDetails?.duration || '',
      viewCount: video.statistics?.viewCount || '0',
      tags: snippet.tags || [],
      thumbnails: {
        default: snippet.thumbnails.default?.url || `https://img.youtube.com/vi/${videoId}/default.jpg`,
        medium: snippet.thumbnails.medium?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        high: snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        standard: snippet.thumbnails.standard?.url || `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
        maxres: snippet.thumbnails.maxres?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      }
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata with API:', error);
    return null;
  }
}

/**
 * Extracts and cleans YouTube video description
 */
export function cleanYouTubeDescription(description: string): string {
  if (!description) return '';
  
  // Remove excessive line breaks and clean up
  return description
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ line breaks with 2
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .substring(0, 500); // Limit to 500 characters for storage
}

/**
 * Formats YouTube duration from ISO 8601 format (PT4M13S) to readable format
 */
export function formatYouTubeDuration(duration: string): string {
  if (!duration) return '';
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Generates auto-tags based on YouTube video metadata
 */
export function generateAutoTags(metadata: YouTubeVideoMetadata): string[] {
  const tags: string[] = [];
  
  // Add channel name as tag
  if (metadata.channelTitle) {
    tags.push(metadata.channelTitle.toLowerCase().replace(/\s+/g, '-'));
  }
  
  // Add 'youtube' tag
  tags.push('youtube');
  
  // Add 'video' tag
  tags.push('video');
  
  // Add any existing tags from video (limit to first 5)
  if (metadata.tags) {
    tags.push(...metadata.tags.slice(0, 5).map(tag => tag.toLowerCase()));
  }
  
  return Array.from(new Set(tags)); // Remove duplicates
}