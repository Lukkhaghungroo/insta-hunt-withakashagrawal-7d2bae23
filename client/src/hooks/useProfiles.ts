import { useState } from 'react';
import { InstagramLead } from '@/types/InstagramLead';
import { useToast } from '@/hooks/use-toast';

// Database types
interface DatabaseProfile {
  id: string;
  username: string;
  url: string;
  brand_name: string;
  followers: number;
  bio: string;
  category: string;
  city: string;
  confidence: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
  bio_embedding?: number[];
}

interface SaveSessionData {
  category: string;
  city: string;
  confirmedProfiles: InstagramLead[];
  unconfirmedProfiles: InstagramLead[];
}

interface SmartSearchResult {
  profiles: InstagramLead[];
  similarity: number;
}

export const useProfiles = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveProfilesToDatabase = async (data: SaveSessionData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/profiles/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: data.category,
          city: data.city,
          confirmedProfiles: data.confirmedProfiles,
          unconfirmedProfiles: data.unconfirmedProfiles,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "Data Saved Successfully!",
        description: `Saved ${result.profileCount || 0} profiles to database.`,
      });

      return { sessionId: result.sessionId || '', profileCount: result.profileCount || 0 };
    } catch (error: any) {
      console.error('Error saving profiles:', error);
      toast({
        title: "Error Saving Data",
        description: error.message || "Failed to save profiles to database.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAllProfiles = async (filters?: {
    category?: string;
    city?: string;
    minFollowers?: number;
    maxFollowers?: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.city) params.append('city', filters.city);
      if (filters?.minFollowers) params.append('minFollowers', filters.minFollowers.toString());
      if (filters?.maxFollowers) params.append('maxFollowers', filters.maxFollowers.toString());

      const response = await fetch(`/api/profiles?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Convert to InstagramLead format
      return data?.map((profile: DatabaseProfile) => ({
        id: profile.id,
        url: profile.url,
        brandName: profile.brand_name,
        userId: profile.username,
        followers: profile.followers,
        category: profile.category,
        city: profile.city,
        confidence: profile.confidence,
      })) || [];
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error Fetching Data",
        description: error.message || "Failed to fetch profiles from database.",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const smartSearch = async (query: string): Promise<SmartSearchResult[]> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return data?.map((profile: DatabaseProfile) => ({
        profiles: [{
          id: profile.id,
          url: profile.url,
          brandName: profile.brand_name,
          userId: profile.username,
          followers: profile.followers,
          category: profile.category,
          city: profile.city,
          confidence: profile.confidence,
        }],
        similarity: 0.8 // Placeholder similarity score
      })) || [];
    } catch (error: any) {
      console.error('Error in smart search:', error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to perform smart search.",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProfileStats = async () => {
    try {
      const response = await fetch('/api/profiles/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return { totalProfiles: 0, categories: [], cities: [] };
    }
  };

  return {
    loading,
    saveProfilesToDatabase,
    getAllProfiles,
    smartSearch,
    getProfileStats,
  };
};