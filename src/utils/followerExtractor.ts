
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
    
    // Number with units without "followers" text
    /([\d,]+\.?\d*)\s*([kKmMbB])\+?/i,
    
    // Raw numbers with "followers"
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*followers?/i,
    
    // Followers with colon: "followers: 1.2K"
    /followers?[:\s]*(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kKmMbB])\+?/i,
    
    // Indian format with L (Lakh)
    /([\d,]+\.?\d*)\s*([lL])\+?\s*followers?/i,
    
    // Just numbers (last resort)
    /(\d+(?:,\d{3})*(?:\.\d+)?)/
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
      return result;
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

// Enhanced brand name formatting
export const formatBrandName = (username: string): string => {
  if (!username) return '';
  
  return username
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
};
