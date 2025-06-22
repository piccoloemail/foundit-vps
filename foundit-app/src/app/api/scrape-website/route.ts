import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface WebsiteMetadata {
  title: string;
  description: string;
  image?: string;
  logo?: string;
  url: string;
  siteName?: string;
  autoTags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are supported' },
        { status: 400 }
      );
    }

    console.log(`🌐 Scraping metadata for: ${url}`);

    // Fetch the webpage
    console.log('📡 Fetching webpage...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    console.log(`📡 Response received: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch webpage: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    console.log('📄 Reading HTML content...');
    const html = await response.text();
    console.log(`📄 HTML length: ${html.length} characters`);
    
    console.log('🔍 Parsing HTML with Cheerio...');
    const $ = cheerio.load(html);

    // Extract metadata
    const metadata: WebsiteMetadata = {
      url,
      title: '',
      description: '',
      autoTags: [],
    };

    // Get title (priority: og:title, title tag, h1)
    metadata.title = 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text() ||
      'Untitled';

    // Get description (priority: og:description, meta description, first p tag)
    let rawDescription = 
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('p').first().text() ||
      '';
    
    // Clean HTML from description
    metadata.description = $('<div>').html(rawDescription).text().trim();

    // Get image (priority: og:image, twitter:image, first img)
    const ogImage = $('meta[property="og:image"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    const firstImg = $('img').first().attr('src');
    
    if (ogImage) {
      metadata.image = ogImage.startsWith('http') ? ogImage : new URL(ogImage, url).href;
    } else if (twitterImage) {
      metadata.image = twitterImage.startsWith('http') ? twitterImage : new URL(twitterImage, url).href;
    } else if (firstImg) {
      metadata.image = firstImg.startsWith('http') ? firstImg : new URL(firstImg, url).href;
    }

    // Get logo (priority: apple-touch-icon, various icon sizes, favicon)
    const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr('href') ||
                          $('link[rel="apple-touch-icon-precomposed"]').attr('href');
    const icon192 = $('link[rel="icon"][sizes*="192"]').attr('href');
    const icon180 = $('link[rel="icon"][sizes*="180"]').attr('href');
    const icon152 = $('link[rel="icon"][sizes*="152"]').attr('href');
    const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
    const manifestIcon = $('link[rel="manifest"]').attr('href');
    
    console.log('🔍 Logo search results:', {
      appleTouchIcon,
      icon192,
      icon180, 
      icon152,
      favicon,
      manifestIcon
    });
    
    if (appleTouchIcon) {
      metadata.logo = appleTouchIcon.startsWith('http') ? appleTouchIcon : new URL(appleTouchIcon, url).href;
    } else if (icon192) {
      metadata.logo = icon192.startsWith('http') ? icon192 : new URL(icon192, url).href;
    } else if (icon180) {
      metadata.logo = icon180.startsWith('http') ? icon180 : new URL(icon180, url).href;
    } else if (icon152) {
      metadata.logo = icon152.startsWith('http') ? icon152 : new URL(icon152, url).href;
    } else if (favicon) {
      metadata.logo = favicon.startsWith('http') ? favicon : new URL(favicon, url).href;
    } else {
      // Fallback: try common favicon locations
      metadata.logo = new URL('/favicon.ico', url).href;
    }
    
    console.log('🖼️ Final logo URL:', metadata.logo);

    // Get site name
    metadata.siteName = 
      $('meta[property="og:site_name"]').attr('content') ||
      $('meta[name="application-name"]').attr('content') ||
      validUrl.hostname;

    // Extract keywords from titles and headers
    const keywordSources = [
      metadata.title,
      $('h1').text(),
      $('h2').text(),
      $('h3').text(),
      $('meta[name="keywords"]').attr('content') || ''
    ].join(' ');

    // Process keywords
    const keywords = keywordSources
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => 
        word.length > 3 && // More than 3 characters
        !['this', 'that', 'with', 'from', 'your', 'will', 'have', 'been', 'were', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'which', 'while', 'would', 'could', 'should', 'about', 'after', 'before', 'during', 'through', 'between', 'among', 'into', 'onto', 'upon', 'over', 'under', 'above', 'below', 'across', 'along', 'around', 'behind', 'beside', 'beyond', 'near', 'within', 'without', 'against', 'toward', 'towards', 'until', 'since', 'except', 'unless', 'because', 'although', 'though', 'however', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'nonetheless', 'otherwise', 'instead', 'meanwhile', 'finally', 'then', 'also', 'just', 'only', 'even', 'still', 'already', 'yet', 'again', 'once', 'more', 'most', 'many', 'much', 'some', 'any', 'all', 'each', 'every', 'both', 'either', 'neither', 'other', 'another', 'such', 'same', 'different', 'new', 'old', 'first', 'last', 'next', 'previous', 'following', 'current', 'recent', 'latest', 'early', 'late', 'long', 'short', 'high', 'low', 'large', 'small', 'big', 'little', 'great', 'good', 'best', 'better', 'bad', 'worse', 'worst', 'important', 'main', 'major', 'minor', 'general', 'specific', 'particular', 'special', 'common', 'usual', 'normal', 'regular', 'standard', 'basic', 'simple', 'easy', 'hard', 'difficult', 'complex', 'clear', 'sure', 'certain', 'possible', 'available', 'free', 'open', 'close', 'full', 'empty', 'complete', 'entire', 'whole', 'total', 'real', 'true', 'false', 'right', 'wrong', 'correct', 'proper', 'ready', 'able', 'unable', 'like', 'want', 'need', 'know', 'think', 'feel', 'look', 'seem', 'become', 'make', 'take', 'give', 'come', 'show', 'tell', 'ask', 'work', 'play', 'run', 'walk', 'talk', 'read', 'write', 'listen', 'watch', 'see', 'hear', 'feel', 'touch', 'taste', 'smell', 'find', 'lose', 'keep', 'leave', 'stay', 'go', 'move', 'stop', 'start', 'begin', 'end', 'finish', 'continue', 'help', 'try', 'use', 'get', 'put', 'set', 'let', 'may', 'can', 'must', 'shall', 'will', 'would', 'could', 'should', 'might', 'ought'].includes(word)
      )
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 10); // Limit to 10 keywords

    metadata.autoTags = keywords;

    // Clean up text fields
    metadata.title = metadata.title.trim().substring(0, 200);
    metadata.description = metadata.description.trim().substring(0, 500);

    console.log(`✅ Successfully extracted metadata:`, {
      title: metadata.title,
      description: metadata.description?.substring(0, 100) + '...',
      hasImage: !!metadata.image,
      hasLogo: !!metadata.logo,
      siteName: metadata.siteName,
      autoTags: metadata.autoTags
    });

    return NextResponse.json({
      success: true,
      metadata
    });

  } catch (error) {
    console.error('❌ Error scraping website:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to scrape website metadata',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}