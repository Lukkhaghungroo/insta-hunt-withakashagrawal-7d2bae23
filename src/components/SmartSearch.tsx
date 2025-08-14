import { useState } from "react";
import { Search, Sparkles, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InstagramLead } from "@/types/InstagramLead";
import { useProfiles } from "@/hooks/useProfiles";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SmartSearchProps {
  onProfilesFound: (profiles: InstagramLead[]) => void;
}

const SmartSearch = ({ onProfilesFound }: SmartSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InstagramLead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'text' | 'vector'>('text');
  const { smartSearch, loading } = useProfiles();
  const { toast } = useToast();

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter Search Query",
        description: "Please enter a search query to find relevant profiles.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // Call the smart search edge function via Supabase client
      const { data, error } = await supabase.functions.invoke('smart-search', {
        body: {
          query: searchQuery,
          limit: 50,
          filters: {}
        }
      });

      if (error) throw error;

      const result = data || {};

      // Convert results to InstagramLead format
      const profiles: InstagramLead[] = (result.results || []).map((item: any) => ({
        id: item.id,
        url: item.url,
        brandName: item.brand_name || item.brandName,
        userId: item.username || item.userId,
        followers: item.followers,
        category: item.category,
        city: item.city,
        confidence: item.confidence,
      }));

      setSearchResults(profiles);
      setSearchType(result.searchType || 'text');
      onProfilesFound(profiles);

      toast({
        title: "Smart Search Complete",
        description: `Found ${profiles.length} relevant profiles using ${result.searchType === 'vector' ? 'AI semantic search' : 'text search'}.`,
      });
    } catch (error: any) {
      console.error('Smart search error:', error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to perform smart search. Try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const openProfileAnalytics = (username: string) => {
    const cleanUsername = username.replace('@', '');
    window.open(`https://instagram.com/${cleanUsername}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Search
          </CardTitle>
          <CardDescription>
            Use AI-powered semantic search to find influencers by intent and context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g., 'AI founders', 'fitness influencers', 'sustainable fashion'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
              />
            </div>
            <Button 
              onClick={handleSmartSearch} 
              disabled={isSearching || loading}
              className="shrink-0"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={searchType === 'vector' ? 'default' : 'secondary'}>
                {searchType === 'vector' ? 'AI Semantic Search' : 'Text Search'}
              </Badge>
              <span>Found {searchResults.length} results</span>
            </div>
          )}
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Click on any profile to open it in Instagram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.brandName}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">@{lead.userId}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatFollowers(lead.followers)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {lead.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.city}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            lead.confidence === 'high' ? 'default' : 
                            lead.confidence === 'medium' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {lead.confidence}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openProfileAnalytics(lead.userId)}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartSearch;