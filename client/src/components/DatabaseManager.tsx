import { useState } from "react";
import { Database, BarChart3, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstagramLead } from "@/types/InstagramLead";
import { useProfiles } from "@/hooks/useProfiles";
import { useToast } from "@/hooks/use-toast";

interface DatabaseManagerProps {
  onProfilesLoaded: (profiles: InstagramLead[]) => void;
}

const DatabaseManager = ({ onProfilesLoaded }: DatabaseManagerProps) => {
  const [profiles, setProfiles] = useState<InstagramLead[]>([]);
  const [stats, setStats] = useState({ totalProfiles: 0, categories: [], cities: [] });
  const [filters, setFilters] = useState({
    category: "all",
    city: "all",
    minFollowers: "",
    maxFollowers: ""
  });
  
  const { getAllProfiles, getProfileStats, loading } = useProfiles();
  const { toast } = useToast();

  const loadProfiles = async () => {
    try {
      const filterParams = {
        category: filters.category !== "all" ? filters.category : undefined,
        city: filters.city !== "all" ? filters.city : undefined,
        minFollowers: filters.minFollowers ? parseInt(filters.minFollowers) : undefined,
        maxFollowers: filters.maxFollowers ? parseInt(filters.maxFollowers) : undefined,
      };
      
      const profileData = await getAllProfiles(filterParams);
      setProfiles(profileData);
      onProfilesLoaded(profileData);
      
      toast({
        title: "Database Loaded",
        description: `Loaded ${profileData.length} profiles from database.`,
      });
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getProfileStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
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

  const openProfile = (username: string) => {
    const cleanUsername = username.replace('@', '');
    window.open(`https://instagram.com/${cleanUsername}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProfiles}</div>
            <p className="text-xs text-muted-foreground">In your database</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.length}</div>
            <p className="text-xs text-muted-foreground">Unique categories</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cities</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cities.length}</div>
            <p className="text-xs text-muted-foreground">Different cities</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current View</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">Profiles loaded</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Database Filters</CardTitle>
          <CardDescription>
            Filter and load profiles from your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {stats.categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city-filter">City</Label>
              <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {stats.cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-followers">Min Followers</Label>
              <Input
                id="min-followers"
                type="number"
                placeholder="e.g., 1000"
                value={filters.minFollowers}
                onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-followers">Max Followers</Label>
              <Input
                id="max-followers"
                type="number"
                placeholder="e.g., 100000"
                value={filters.maxFollowers}
                onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={loadProfiles} disabled={loading}>
              Load Profiles
            </Button>
            <Button onClick={loadStats} variant="outline" disabled={loading}>
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {profiles.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Database Profiles</CardTitle>
            <CardDescription>
              Profiles stored in your database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.brandName}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">@{profile.userId}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatFollowers(profile.followers)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {profile.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{profile.city}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            profile.confidence === 'high' ? 'default' : 
                            profile.confidence === 'medium' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {profile.confidence}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openProfile(profile.userId)}
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

export default DatabaseManager;