
// Enhanced follower extraction utility with better parsing and fallback methods
export const extractFollowersFromCSS = async (url: string): Promise<number> => {
  return new Promise((resolve) => {
    // Since we can't actually access Instagram's DOM from our app due to CORS,
    // this function serves as a placeholder for browser extension integration
    console.log('CSS extraction attempted for:', url);
    resolve(0);
  });
};

// Enhanced follower parsing from text with better regex patterns
export const parseFollowerCount = (text: string): number => {
  if (!text) return 0;

  // Fast path: number with unit (K/M/B/L)
  const quickUnit = text.match(/([\d,.]+)\s*([kKmMbBlL])\+?/);
  if (quickUnit) {
    let num = parseFloat(quickUnit[1].replace(/,/g, ''));
    const unit = quickUnit[2].toLowerCase();
    if (unit === 'k') num *= 1_000;
    else if (unit === 'm') num *= 1_000_000;
    else if (unit === 'b') num *= 1_000_000_000;
    else if (unit === 'l') num *= 100_000; // Lakh
    const result = Math.round(num);
    if (result >= 1 && result <= 1_000_000_000) return result;
  }

  // Fast path: raw number next to the word "followers"
  const afterFollowers = text.match(/followers?[:\s]*([\d,.]+)\s*([kKmMbBlL])?/i);
  if (afterFollowers) {
    let num = parseFloat(afterFollowers[1].replace(/,/g, ''));
    const unit = afterFollowers[2]?.toLowerCase();
    if (unit === 'k') num *= 1_000;
    else if (unit === 'm') num *= 1_000_000;
    else if (unit === 'b') num *= 1_000_000_000;
    else if (unit === 'l') num *= 100_000;
    const result = Math.round(num);
    if (result >= 1 && result <= 1_000_000_000) return result;
  }

  // Fallback to robust patterns
  const patterns = [
    /([\d,]+\.?\d*)\s*([kKmMbB])\+?\s*followers?/i,
    /([\d,]+\.?\d*)\s*([kKmMbB])\+?\s*follower/i,
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*followers?/i,
    /followers?[:\s]*(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kKmMbB])\+?/i,
    /([\d,]+\.?\d*)\s*([lL])\+?\s*followers?/i,
    /([\d,]+\.?\d*)\s*([kKmMbB])\+?\s*(?![\w])/i,
    /(\d{1,3}(?:,\d{3})+)(?!\s*[a-zA-Z])/, 
    /(\d{4,})(?!\s*[a-zA-Z])/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let number = parseFloat(match[1].replace(/,/g, ''));
      const unit = match[2]?.toLowerCase();
      if (unit === 'k') number *= 1_000;
      else if (unit === 'm') number *= 1_000_000;
      else if (unit === 'b') number *= 1_000_000_000;
      else if (unit === 'l') number *= 100_000;
      const result = Math.round(number);
      if (result >= 1 && result <= 1_000_000_000) return result;
    }
  }

  return 0;
};

// Enhanced username extraction from various formats
export const extractUsernameFromUrl = (input: string): string => {
  if (!input) return '';

  // 1) Direct username like "+john.doe" or "@brand_name" or "brand.name"
  const directUsername = input.trim().replace(/^[@+]/, '');
  if (/^[a-zA-Z0-9._]{2,30}$/.test(directUsername)) {
    return directUsername;
  }

  // 2) Try to normalize to a URL if missing scheme
  const maybeUrl = input.startsWith('http') ? input : `https://${input.replace(/^\/+/, '')}`;

  try {
    const urlObj = new URL(maybeUrl);
    // Only consider instagram domains
    if (!/(^|\.)instagram\.com$/i.test(urlObj.hostname)) return '';

    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    // Profile URL pattern: instagram.com/username[/]
    if (pathParts.length >= 1 && !['p', 'reel', 'stories', 'explore'].includes(pathParts[0].toLowerCase())) {
      const candidate = pathParts[0];
      return /^[a-zA-Z0-9._]{2,30}$/.test(candidate) ? candidate : '';
    }

    // Post/reel URLs won't contain username reliably
    return '';
  } catch {
    // 3) Fallback regex: extract username from embedded instagram.com URL fragments
    const m = input.match(/instagram\.com\/(?:p\/[^\s/]+|reel\/[^\s/]+|([a-zA-Z0-9._]+))/i);
    if (m && m[1] && /^[a-zA-Z0-9._]{2,30}$/.test(m[1])) return m[1];
    return '';
  }
};

// Enhanced brand name formatting with better intelligence
export const formatBrandName = (username: string): string => {
  if (!username) return 'Unknown';
  
  // If username starts with 'unknown_', try to create a better name
  if (username.startsWith('unknown_')) {
    return `Profile ${username.replace('unknown_', '')}`;
  }
  
  // Remove common prefixes/suffixes that aren't part of brand names
  let cleaned = username
    .replace(/^(the|official|real)_?/i, '')
    .replace(/_(official|real|page)$/i, '');
  
  // Format the name
  return cleaned
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim() || 'Unknown Brand';
};

// Enhanced function to extract meaningful data from various text formats
export const extractProfileInfo = (text: string, url: string): { username: string; brandName: string; confidence: 'high' | 'medium' | 'low'; bio?: string } => {
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');
  let username = '';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let bio = '';
  
  // Extract bio information if available
  const bioMatch = text.match(/bio[:\s]*(.*?)(?:\n|$|followers|following)/i);
  if (bioMatch) {
    bio = bioMatch[1].trim();
  }
  
  if (cleanUrl.includes('/p/') || cleanUrl.includes('/reel/')) {
    // For post/reel URLs, try to extract username from context
    const usernameMatches = [
      text.match(/@([a-zA-Z0-9._]+)/),
      text.match(/by\s+([a-zA-Z0-9._]+)/i),
      text.match(/([a-zA-Z0-9._]+)\s+•/),
      text.match(/username[:\s]*([a-zA-Z0-9._]+)/i)
    ];
    
    for (const match of usernameMatches) {
      if (match && match[1] && match[1].length > 2) {
        username = match[1];
        confidence = 'medium';
        break;
      }
    }
    
    if (!username) {
      username = extractUsernameFromUrl(cleanUrl) || `profile_${Date.now()}`;
      confidence = 'low';
    }
  } else {
    // Direct profile URL
    username = extractUsernameFromUrl(cleanUrl) || '';
    confidence = username ? 'high' : 'low';
  }
  
  const brandName = formatBrandName(username);
  
  return { username, brandName, confidence, bio };
};

// Prefer scraped data first, fallback to parsing text; CSS selector extraction should
// be handled by an external scraper/extension due to CORS.
export const resolveFollowers = (
  scrapedFollowers?: number | string,
  scrapedText?: string
): number => {
  // 1) Valid numeric followers from scraped source
  if (typeof scrapedFollowers === 'number' && scrapedFollowers > 0) {
    return Math.round(scrapedFollowers);
  }

  // 2) Followers provided as string (e.g., "1.2K")
  if (typeof scrapedFollowers === 'string') {
    const parsed = parseFollowerCount(scrapedFollowers);
    if (parsed > 0) return parsed;
  }

  // 3) Parse from any provided text snippet/row
  if (scrapedText) {
    const parsed = parseFollowerCount(scrapedText);
    if (parsed > 0) return parsed;
  }

  // 4) Fallback: 0 (caller may decide to trigger CSS extraction externally)
  return 0;
};

