
export interface InstagramLead {
  id: string;
  url: string;
  brandName: string;
  userId: string;
  followers: number;
  category: string;
  city: string;
  confidence: 'high' | 'medium' | 'low';
  bio?: string; // Add optional bio field
}
