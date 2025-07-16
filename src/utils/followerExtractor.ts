
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
  
  console.log('Parsing follower text:', text);
  
  // Enhanced patterns to catch more follower count formats
  const patterns = [
    // Standard formats: "1.2K followers", "1,234 followers", etc.
    /([\d,]+\.?\d*)\s*([kKmMbB])\+?\s*followers?/i,
    /([\d,]+\.?\d*)\s*([kKmMbB])\+?\s*follower/i,
    
    // Raw numbers with "followers"
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*followers?/i,
    
    // Followers with colon: "followers: 1.2K"
    /followers?[:\s]*(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kKmMbB])\+?/i,
    
    // Indian format with L (Lakh)
    /([\d,]+\.?\d*)\s*([lL])\+?\s*followers?/i,
    
    // Number with units (more specific patterns first)
    /([\d,]+\.?\d*)\s*([kKmMbB])\+?\s*(?![\w])/i,
    
    // Just large numbers (with commas) - be more selective
    /(\d{1,3}(?:,\d{3})+)(?!\s*[a-zA-Z])/,
    
    // Just medium numbers (without units) - only if no other numbers found
    /(\d{4,})(?!\s*[a-zA-Z])/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('Found follower match:', match);
      let number = parseFloat(match[1].replace(/,/g, ''));
      const unit = match[2]?.toLowerCase();
      
      // Convert based on unit
      if (unit === 'k') {
        number *= 1000;
      } else if (unit === 'm') {
        number *= 1000000;
      } else if (unit === 'b') {
        number *= 1000000000;
      } else if (unit === 'l') {
        number *= 100000; // Lakh = 100,000
      }
      
      const result = Math.round(number);
      console.log('Parsed followers:', result);
      
      // Return only if the number makes sense for Instagram followers
      if (result >= 1 && result <= 1000000000) {
        return result;
      }
    }
  }
  
  console.log('No follower count found in text');
  return 0;
};

// Enhanced username extraction from various formats
export const extractUsernameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    // For profile URLs: instagram.com/username
    if (pathParts.length >= 1 && !pathParts[0].includes('p') && !pathParts[0].includes('reel')) {
      return pathParts[0];
    }
    
    // For post/reel URLs, try to extract from context
    return '';
  } catch (error) {
    console.error('Error extracting username from URL:', error);
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
