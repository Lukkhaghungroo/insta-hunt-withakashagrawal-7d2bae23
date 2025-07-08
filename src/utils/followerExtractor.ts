// Instagram follower extraction utilities using CSS selectors

export interface FollowerExtractionResult {
  followers: number;
  source: 'css' | 'scraped' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * CSS selectors for extracting follower counts from Instagram profiles
 * These selectors target the follower count span element
 */
export const INSTAGRAM_FOLLOWER_SELECTORS = [
  // Primary selectors for follower links
  'a[href*="/followers/"] span[title]',
  'a[href*="/followers/"] span:first-child',
  
  // Direct span selectors with title attribute (most reliable)
  'span[title] + span:contains("followers")',
  'span[title]:has(+ span:contains("followers"))',
  
  // Navigation list selectors (second li usually contains followers)
  'nav ul li:nth-child(2) span[title]',
  'section ul li:nth-child(2) div a span[title]',
  'ul li:nth-child(2) div a span',
  
  // Header section selectors
  'header section ul li:nth-child(2) span[title]',
  'main header section ul li:nth-child(2) span[title]',
  
  // Mount point specific selectors (Instagram's main containers)
  '#mount_0_0_Xd span[title]',
  '#mount_0_0_dm span[title]',
  '#mount_0_0_Xd section ul li:nth-child(2) span[title]',
  '#mount_0_0_dm section ul li:nth-child(2) span[title]',
  
  // More specific path selectors
  '#mount_0_0_Xd > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div:nth-child(2) > div > div.xvc5jky.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1xdureb.x18wylqe.x13vxnyz.xvxrpd7 > ul > li:nth-child(2) > div > a > span',
  '#mount_0_0_dm > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div:nth-child(2) > div > div.xvc5jky.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1xdureb.x18wylqe.x13vxnyz.xvxrpd7 > ul > li:nth-child(2) > div > a > span',
  
  // XPath equivalent as CSS (for reference)
  // '/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[2]/div/div[1]/section/main/div/header/section[3]/ul/li[2]/div/a/span'
];

/**
 * Extract follower count from Instagram page using CSS selectors
 * This function would typically be used in a browser extension or automation script
 */
export const extractFollowersFromPage = (): FollowerExtractionResult => {
  let followers = 0;
  let source: 'css' | 'scraped' | 'unknown' = 'unknown';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // Try each selector until we find a valid follower count
  for (const selector of INSTAGRAM_FOLLOWER_SELECTORS) {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      
      if (element) {
        // Check for title attribute first (most reliable)
        const titleText = element.getAttribute('title');
        if (titleText) {
          const parsedFollowers = parseFollowerText(titleText);
          if (parsedFollowers > 0) {
            followers = parsedFollowers;
            source = 'css';
            confidence = 'high';
            console.log(`Found followers via CSS selector "${selector}":`, followers);
            break;
          }
        }
        
        // Check text content as fallback
        const textContent = element.textContent?.trim();
        if (textContent) {
          const parsedFollowers = parseFollowerText(textContent);
          if (parsedFollowers > 0) {
            followers = parsedFollowers;
            source = 'css';
            confidence = 'medium';
            console.log(`Found followers via CSS text content "${selector}":`, followers);
            break;
          }
        }
      }
    } catch (error) {
      console.warn(`Selector "${selector}" failed:`, error);
    }
  }

  // If no CSS selector worked, try finding by text content
  if (followers === 0) {
    const followerElements = Array.from(document.querySelectorAll('span, div, a')).filter(
      el => el.textContent?.includes('followers') || el.textContent?.includes('follower')
    );
    
    for (const element of followerElements) {
      const text = element.textContent?.trim();
      if (text) {
        const parsedFollowers = parseFollowerText(text);
        if (parsedFollowers > 0) {
          followers = parsedFollowers;
          source = 'css';
          confidence = 'low';
          console.log('Found followers via text search:', followers);
          break;
        }
      }
    }
  }

  return { followers, source, confidence };
};

/**
 * Parse follower count from text string
 */
export const parseFollowerText = (text: string): number => {
  if (!text) return 0;
  
  // Remove commas and clean the text
  const cleanText = text.replace(/,/g, '').toLowerCase();
  
  // Pattern to match follower counts with units
  const patterns = [
    // Exact number with commas (like "303,456")
    /(\d+(?:,\d{3})*)\s*followers?/i,
    // Number with K/M/L suffix
    /([\d.]+)\s*([kml])\+?\s*followers?/i,
    // Just the number with units
    /([\d.]+)\s*([kml])\+?/i,
    // Plain number
    /^(\d+(?:,\d{3})*)$/,
    // Number at start of string
    /^(\d+(?:\.\d+)?)/
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      let number = parseFloat(match[1].replace(/,/g, ''));
      const unit = match[2]?.toLowerCase();
      
      if (unit === 'k') {
        number *= 1000;
      } else if (unit === 'm') {
        number *= 1000000;
      } else if (unit === 'l') {
        number *= 100000; // Lakh = 100,000
      }
      
      return Math.round(number);
    }
  }
  
  return 0;
};

/**
 * Inject a script to extract followers from the current Instagram page
 * This would be used in a browser extension or automation tool
 */
export const createFollowerExtractionScript = (): string => {
  return `
    (function() {
      ${extractFollowersFromPage.toString()}
      ${parseFollowerText.toString()}
      
      const SELECTORS = ${JSON.stringify(INSTAGRAM_FOLLOWER_SELECTORS)};
      
      // Execute extraction
      const result = extractFollowersFromPage();
      
      // Send result back (could be via postMessage, return, etc.)
      return result;
    })();
  `;
};

/**
 * Browser automation friendly function to get Instagram followers
 * Returns a promise that resolves with the follower count
 */
export const getInstagramFollowers = async (url: string): Promise<FollowerExtractionResult> => {
  // This would typically interface with browser automation tools like Puppeteer, Playwright, etc.
  // For now, return default result indicating CSS extraction is not available in this environment
  
  console.log('CSS extraction attempted for:', url);
  console.log('Note: This requires browser automation or extension environment');
  
  return {
    followers: 0,
    source: 'unknown',
    confidence: 'low'
  };
};