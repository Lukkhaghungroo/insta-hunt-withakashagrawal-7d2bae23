
import { useState } from "react";
import { Search, Download, Filter, Users, MapPin, Instagram, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface InstagramLead {
  id: string;
  url: string;
  brandName: string;
  userId: string;
  followers: number;
  category: string;
  city: string;
}

const Index = () => {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [leads, setLeads] = useState<InstagramLead[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState<"followers" | "brandName">("followers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  // Mock data for demonstration
  const mockLeads: InstagramLead[] = [
    {
      id: "1",
      url: "https://instagram.com/glowskinmumbai",
      brandName: "Glow Skin Clinic",
      userId: "glowskinmumbai",
      followers: 15600,
      category: "Skin Clinic",
      city: "Mumbai"
    },
    {
      id: "2",
      url: "https://instagram.com/beautyhubmumbai",
      brandName: "Beauty Hub Mumbai",
      userId: "beautyhubmumbai",
      followers: 8900,
      category: "Skin Clinic",
      city: "Mumbai"
    },
    {
      id: "3",
      url: "https://instagram.com/clearskincenter",
      brandName: "Clear Skin Center",
      userId: "clearskincenter",
      followers: 23400,
      category: "Skin Clinic",
      city: "Mumbai"
    },
    {
      id: "4",
      url: "https://instagram.com/radiantderma",
      brandName: "Radiant Dermatology",
      userId: "radiantderma",
      followers: 31200,
      category: "Skin Clinic",
      city: "Mumbai"
    },
    {
      id: "5",
      url: "https://instagram.com/skincarespecialist",
      brandName: "Skincare Specialist",
      userId: "skincarespecialist",
      followers: 5700,
      category: "Skin Clinic",
      city: "Mumbai"
    }
  ];

  const handleSearch = async () => {
    if (!category.trim() || !city.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both category and city to search.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    setLeads([]);

    // Simulate search progress
    const progressSteps = [
      { progress: 20, message: "Generating search URLs..." },
      { progress: 40, message: "Scraping Google SERP (Page 1/3)..." },
      { progress: 60, message: "Scraping Google SERP (Page 2/3)..." },
      { progress: 80, message: "Scraping Google SERP (Page 3/3)..." },
      { progress: 95, message: "Cleaning and deduplicating data..." },
      { progress: 100, message: "Search complete!" }
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSearchProgress(step.progress);
    }

    // Set mock results
    setLeads(mockLeads);
    setIsSearching(false);

    toast({
      title: "Search Complete!",
      description: `Found ${mockLeads.length} Instagram leads for ${category} in ${city}.`
    });
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const filteredAndSortedLeads = leads
    .filter(lead => 
      lead.brandName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      lead.userId.toLowerCase().includes(searchFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "followers") {
        return sortOrder === "desc" ? b.followers - a.followers : a.followers - b.followers;
      } else {
        return sortOrder === "desc" 
          ? b.brandName.localeCompare(a.brandName)
          : a.brandName.localeCompare(b.brandName);
      }
    });

  const handleExport = (format: "csv" | "excel") => {
    const headers = ["Brand Name", "Instagram URL", "User ID", "Followers", "Category", "City"];
    const csvData = [
      headers.join(","),
      ...filteredAndSortedLeads.map(lead => 
        [lead.brandName, lead.url, lead.userId, lead.followers, lead.category, lead.city].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagram-leads-${category}-${city}.${format === "csv" ? "csv" : "xlsx"}`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete!",
      description: `Downloaded ${filteredAndSortedLeads.length} leads as ${format.toUpperCase()}.`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-xl">
              <Instagram className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Instagram Lead Finder
              </h1>
              <p className="text-gray-600 mt-1">Find potential clients and influencers on Instagram</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Search Parameters</span>
            </CardTitle>
            <CardDescription>
              Enter the business category and city to find Instagram profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Business Category</span>
                </label>
                <Input
                  placeholder="e.g., Skin Clinic, Restaurant, Gym"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>City</span>
                </label>
                <Input
                  placeholder="e.g., Mumbai, Delhi, Bangalore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Start Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        {isSearching && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">
                    Searching Instagram profiles...
                  </span>
                  <span className="text-sm text-blue-700">{searchProgress}%</span>
                </div>
                <Progress value={searchProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {leads.length > 0 && !isSearching && (
          <div className="space-y-6">
            {/* Stats and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="px-4 py-2 text-base">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {filteredAndSortedLeads.length} leads found
                </Badge>
                <div className="text-sm text-gray-600">
                  for <span className="font-medium">{category}</span> in <span className="font-medium">{city}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Filter by name or username..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handleExport("csv")}
                  className="flex items-center space-x-2 hover:bg-green-50 hover:border-green-300"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleExport("excel")}
                  className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Excel</span>
                </Button>
              </div>
            </div>

            {/* Results Table */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
                          onClick={() => {
                            if (sortBy === "brandName") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("brandName");
                              setSortOrder("asc");
                            }
                          }}
                        >
                          Brand Name {sortBy === "brandName" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead>Instagram Profile</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
                          onClick={() => {
                            if (sortBy === "followers") {
                              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("followers");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          Followers {sortBy === "followers" && (sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedLeads.map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-blue-50/50 transition-colors">
                          <TableCell className="font-medium">{lead.brandName}</TableCell>
                          <TableCell>
                            <a 
                              href={lead.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-2"
                            >
                              <Instagram className="h-4 w-4" />
                              <span>View Profile</span>
                            </a>
                          </TableCell>
                          <TableCell className="font-mono text-sm">@{lead.userId}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{formatFollowers(lead.followers)}</span>
                              <Badge 
                                variant={lead.followers > 20000 ? "default" : lead.followers > 10000 ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                {lead.followers > 20000 ? "High" : lead.followers > 10000 ? "Medium" : "Low"}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {leads.length === 0 && !isSearching && (
          <Card className="text-center py-12 bg-white/60 backdrop-blur-sm border-dashed border-2 border-gray-300">
            <CardContent>
              <Instagram className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Find Instagram Leads</h3>
              <p className="text-gray-500 mb-6">
                Enter a business category and city above to discover potential clients and influencers on Instagram.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-600">
                <div className="bg-white/80 p-4 rounded-lg border">
                  <div className="font-medium text-blue-600 mb-1">🎯 Targeted Search</div>
                  <div>Find profiles by category and location</div>
                </div>
                <div className="bg-white/80 p-4 rounded-lg border">
                  <div className="font-medium text-green-600 mb-1">📊 Rich Data</div>
                  <div>Get follower counts and profile details</div>
                </div>
                <div className="bg-white/80 p-4 rounded-lg border">
                  <div className="font-medium text-purple-600 mb-1">💾 Easy Export</div>
                  <div>Download results as CSV or Excel</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
