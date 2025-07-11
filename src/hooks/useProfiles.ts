import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InstagramLead } from '@/types/InstagramLead';
import { useToast } from '@/hooks/use-toast';

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
      // Create scraping session
      const { data: session, error: sessionError } = await supabase
        .from('scraping_sessions')
        .insert({
          category: data.category,
          city: data.city,
          total_profiles: data.confirmedProfiles.length + data.unconfirmedProfiles.length,
          confirmed_profiles: data.confirmedProfiles.length,
          unconfirmed_profiles: data.unconfirmedProfiles.length,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Prepare profile data for insertion
      const allProfiles = [...data.confirmedProfiles, ...data.unconfirmedProfiles];
      const profilesToInsert = allProfiles.map(profile => ({
        username: profile.userId,
        url: profile.url,
        brand_name: profile.brandName,
        followers: profile.followers,
        bio: '', // Will be populated by bio extraction in phase 2
        category: data.category,
        city: data.city,
        confidence: profile.confidence,
      }));

      // Insert profiles (use upsert to handle duplicates)
      const { data: insertedProfiles, error: profilesError } = await supabase
        .from('profiles')
        .upsert(profilesToInsert, { 
          onConflict: 'username',
          ignoreDuplicates: false 
        })
        .select();

      if (profilesError) throw profilesError;

      toast({
        title: "Data Saved Successfully!",
        description: `Saved ${insertedProfiles?.length || 0} profiles to database.`,
      });

      return { sessionId: session.id, profileCount: insertedProfiles?.length || 0 };
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
      let query = supabase.from('profiles').select('*');

      if (filters?.category) {
        query = query.ilike('category', `%${filters.category}%`);
      }
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.minFollowers) {
        query = query.gte('followers', filters.minFollowers);
      }
      if (filters?.maxFollowers) {
        query = query.lte('followers', filters.maxFollowers);
      }

      const { data, error } = await query.order('followers', { ascending: false });

      if (error) throw error;

      // Convert to InstagramLead format
      return data?.map(profile => ({
        id: profile.id,
        url: profile.url,
        brandName: profile.brand_name,
        userId: profile.username,
        followers: profile.followers,
        category: profile.category,
        city: profile.city,
        confidence: profile.confidence as 'high' | 'medium' | 'low',
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
      // For now, implement basic text search until AI embeddings are ready
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`brand_name.ilike.%${query}%,bio.ilike.%${query}%,category.ilike.%${query}%`)
        .order('followers', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data?.map(profile => ({
        profiles: [{
          id: profile.id,
          url: profile.url,
          brandName: profile.brand_name,
          userId: profile.username,
          followers: profile.followers,
          category: profile.category,
          city: profile.city,
          confidence: profile.confidence as 'high' | 'medium' | 'low',
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
      const { data, error } = await supabase
        .from('profiles')
        .select('category, city, confidence')
        .select('count');

      if (error) throw error;

      return {
        totalProfiles: data?.length || 0,
        categories: [...new Set(data?.map(p => p.category).filter(Boolean))] || [],
        cities: [...new Set(data?.map(p => p.city).filter(Boolean))] || [],
      };
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