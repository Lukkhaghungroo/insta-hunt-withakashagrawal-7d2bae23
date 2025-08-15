import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InstagramLead } from '@/types/InstagramLead';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Use the proper Supabase database types
type DatabaseProfile = Database['public']['Tables']['profiles']['Row'];

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

      // Prepare profile data for insertion with proper data extraction
      const allProfiles = [...data.confirmedProfiles, ...data.unconfirmedProfiles];
      const profilesToInsert = await Promise.all(
        allProfiles.map(async (profile) => {
          // Extract better profile information
          const extractedData = await extractProfileData(profile.url, profile.userId);
          
          return {
            username: extractedData.username || profile.userId,
            url: profile.url,
            brand_name: extractedData.brandName || profile.brandName,
            followers: extractedData.followers || profile.followers,
            bio: extractedData.bio || '',
            category: data.category,
            city: data.city,
            confidence: extractedData.confidence || profile.confidence,
            session_id: session?.id,
          };
        })
      );

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

      return { sessionId: session?.id || '', profileCount: insertedProfiles?.length || 0 };
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

      // Convert to InstagramLead format and include bio
      return data?.map((profile) => ({
        id: profile.id,
        url: profile.url,
        brandName: profile.brand_name || 'Unknown Brand',
        userId: profile.username,
        followers: profile.followers || 0,
        category: profile.category || 'Unknown',
        city: profile.city || 'Unknown',
        confidence: (profile.confidence as 'high' | 'medium' | 'low') || 'low',
        bio: profile.bio || '', // Include bio data
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

      return data?.map((profile) => ({
        profiles: [{
          id: profile.id,
          url: profile.url,
          brandName: profile.brand_name || 'Unknown Brand',
          userId: profile.username,
          followers: profile.followers || 0,
          category: profile.category || 'Unknown',
          city: profile.city || 'Unknown',
          confidence: (profile.confidence as 'high' | 'medium' | 'low') || 'low',
          bio: profile.bio || '', // Include bio in search results
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
        .select('category, city, confidence');

      if (error) throw error;

      const categories = data ? [...new Set(data.map((p) => p.category).filter(Boolean))] : [];
      const cities = data ? [...new Set(data.map((p) => p.city).filter(Boolean))] : [];
      
      return {
        totalProfiles: data?.length || 0,
        categories,
        cities,
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return { totalProfiles: 0, categories: [], cities: [] };
    }
  };

  const extractProfileData = async (url: string, username: string) => {
    try {
      // Call our edge function to extract profile data
      const { data, error } = await supabase.functions.invoke('extract-profile-bio', {
        body: { url, username }
      });

      if (error) {
        console.error('Error extracting profile data:', error);
        return {
          username,
          brandName: formatBrandName(username),
          followers: 0,
          bio: '',
          confidence: 'low' as const
        };
      }

      return {
        username: data.username || username,
        brandName: data.brandName || formatBrandName(username),
        followers: data.followers || 0,
        bio: data.bio || '',
        confidence: data.confidence || 'low' as const
      };
    } catch (error) {
      console.error('Error in extractProfileData:', error);
      return {
        username,
        brandName: formatBrandName(username),
        followers: 0,
        bio: '',
        confidence: 'low' as const
      };
    }
  };

  const formatBrandName = (username: string): string => {
    if (!username) return 'Unknown';
    return username
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim() || 'Unknown Brand';
  };

  const updateProfilesWithBio = async () => {
    setLoading(true);
    try {
      // Get profiles with missing bio data
      const { data: profilesWithoutBio, error } = await supabase
        .from('profiles')
        .select('*')
        .or('bio.is.null,bio.eq.')
        .limit(10); // Process in batches

      if (error) throw error;

      if (profilesWithoutBio && profilesWithoutBio.length > 0) {
        const updatedProfiles = [];
        
        for (const profile of profilesWithoutBio) {
          const extractedData = await extractProfileData(profile.url, profile.username);
          
          if (extractedData.bio) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                bio: extractedData.bio,
                brand_name: extractedData.brandName,
                followers: extractedData.followers,
                confidence: extractedData.confidence
              })
              .eq('id', profile.id);

            if (!updateError) {
              updatedProfiles.push(profile.username);
            }
          }
        }

        toast({
          title: "Bio Update Complete",
          description: `Updated bio data for ${updatedProfiles.length} profiles.`,
        });

        return updatedProfiles.length;
      }

      return 0;
    } catch (error: any) {
      console.error('Error updating profiles with bio:', error);
      toast({
        title: "Error Updating Profiles",
        description: error.message || "Failed to update profile bio data.",
        variant: "destructive"
      });
      return 0;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveProfilesToDatabase,
    getAllProfiles,
    smartSearch,
    getProfileStats,
    extractProfileData,
    updateProfilesWithBio,
  };
};