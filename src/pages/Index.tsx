
import { useState } from "react";
import { Search, Download, Filter, Users, MapPin, Instagram, Loader2, Upload, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [rawData, setRawData] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [leads, setLeads] = useState<InstagramLead[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState<"followers" | "brandName">("followers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [urlCopied, setUrlCopied] = useState(false);
  const { toast } = useToast();

  const generateSearchUrl = () => {
    if (!category.trim() || !city.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both category and city to generate search URL.",
        variant: "destructive"
      });
      return;
    }

    const searchQuery = `site:instagram.com "${category.trim()}" "${city.trim()}"`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://www.google.com/search?q=${encodedQuery}&num=100`;
    
    setGeneratedUrl(url);
    toast({
      title: "Search URL Generated!",
      description: "Copy the URL and use it in Google to scrape Instagram profiles."
    });
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
      toast({
        title: "URL Copied!",
        description: "The search URL has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the URL from the field above.",
        variant: "destructive"
      });
    }
  };

  const openInGoogle = () => {
    if (generatedUrl) {
      window.open(generatedUrl, '_blank');
    }
  };

  const parseInstagramData = (data: string): InstagramLead[] => {
    const lines = data.split('\n').filter(line => line.trim());
    const leads: InstagramLead[] = [];
    const seenUrls = new Set<string>();

    lines.forEach((line, index) => {
      // Try to extract Instagram URLs from various formats
      const instagramUrlMatch = line.match(/https?:\/\/(?:www\.)?instagram\.com\/([^\/\s,"]+)/);
      
      if (instagramUrlMatch) {
        const fullUrl = instagramUrlMatch[0];
        const userId = instagramUrlMatch[1];
        
        // Skip if we've already seen this URL
        if (seenUrls.has(fullUrl)) return;
        seenUrls.add(fullUrl);

        // Extract brand name (try to get from surrounding text)
        let brandName = userId.replace(/_/g, ' ').replace(/\./g, ' ');
        brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

        // Try to extract follower count
        let followers = 0;
        const followerMatch = line.match(/([\d,]+\.?\d*)\s*(K|M|k|m)?\s*followers?/i);
        if (followerMatch) {
          let number = parseFloat(followerMatch[1].replace(/,/g, ''));
          const unit = followerMatch[2]?.toUpperCase();
          if (unit === 'K') number *= 1000;
          if (unit === 'M') number *= 1000000;
          followers = Math.round(number);
        }

        leads.push({
          id: `${index}-${userId}`,
          url: fullUrl,
          brandName,
          userId,
          followers,
          category,
          city
        });
      }
    });

    return leads;
  };

  const cleanAndFilterData = () => {
    if (!rawData.trim()) {
      toast({
        title: "No Data Found",
        description: "Please paste your scraped data or upload a CSV file first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    // Simulate processing time
    setTimeout(() => {
      const parsedLeads = parseInstagramData(rawData);
      
      // Apply follower filter if specified
      let filteredLeads = parsedLeads;
      if (minFollowers && parseInt(minFollowers) > 0) {
        filteredLeads = parsedLeads.filter(lead => 
          lead.followers >= parseInt(minFollowers) || lead.followers === 0
        );
      }

      setLeads(filteredLeads);
      setIsProcessing(false);

      toast({
        title: "Data Processed Successfully!",
        description: `Found ${filteredLeads.length} Instagram leads after cleaning and filtering.`
      });
    }, 2000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawData(content);
      toast({
        title: "File Uploaded",
        description: "CSV file has been loaded. Click 'Clean & Filter Data' to process."
      });
    };
    reader.readAsText(file);
  };

  const formatFollowers = (count: number) => {
    if (count === 0) return "Unknown";
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
        [
          `"${lead.brandName}"`,
          lead.url,
          lead.userId,
          lead.followers,
          `"${lead.category}"`,
          `"${lead.city}"`
        ].join(",")
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
                Instagram Lead Finder (Semi-Auto)
              </h1>
              <p className="text-gray-600 mt-1">Generate search URLs, scrape manually, then clean and export leads</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Step 1: URL Generation */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Step 1: Generate Search URL</span>
            </CardTitle>
            <CardDescription>
              Enter your search criteria to generate a Google search URL for Instagram profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  onClick={generateSearchUrl}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Generate Search URL
                </Button>
              </div>
            </div>

            {generatedUrl && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-sm font-medium text-blue-900 mb-2 block">Generated Search URL:</label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={generatedUrl}
                    readOnly
                    className="flex-1 bg-white border-blue-300 text-sm"
                  />
                  <Button
                    onClick={copyUrl}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    {urlCopied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    <span>{urlCopied ? "Copied!" : "Copy"}</span>
                  </Button>
                  <Button
                    onClick={openInGoogle}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in Google</span>
                  </Button>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  💡 Use this URL in Google, then scrape all Instagram links using Instant Data Scraper or similar extension. Navigate through all result pages for complete data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Data Input */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-green-600" />
              <span>Step 2: Upload Scraped Data</span>
            </CardTitle>
            <CardDescription>
              Paste your scraped data or upload a CSV file from your scraping extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Paste Scraped Data Here:</label>
                <Textarea
                  placeholder="Paste your scraped Instagram data here (URLs, brand names, follower counts, etc.)"
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  className="h-32 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Or Upload CSV File:</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Drag & drop your CSV file here</p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      Choose File
                    </Button>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Minimum Followers (optional):</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button
                onClick={cleanAndFilterData}
                disabled={isProcessing || !rawData.trim()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4 mr-2" />
                    Clean & Filter Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {leads.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Instagram className="h-5 w-5 text-purple-600" />
                    <span>Step 3: Clean Results</span>
                  </CardTitle>
                  <Badge variant="secondary" className="px-3 py-1">
                    {filteredAndSortedLeads.length} leads found
                  </Badge>
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
            </CardHeader>
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
                            {lead.followers > 0 && (
                              <Badge 
                                variant={lead.followers > 20000 ? "default" : lead.followers > 10000 ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                {lead.followers > 20000 ? "High" : lead.followers > 10000 ? "Medium" : "Low"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {leads.length === 0 && !isProcessing && (
          <Card className="text-center py-12 bg-white/60 backdrop-blur-sm border-dashed border-2 border-gray-300">
            <CardContent>
              <Instagram className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Find Instagram Leads</h3>
              <p className="text-gray-500 mb-6">
                Follow the 3-step process: Generate URL → Scrape Data → Clean & Export
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm text-gray-600">
                <div className="bg-white/80 p-4 rounded-lg border">
                  <div className="font-medium text-blue-600 mb-1">🔗 Step 1: Generate URL</div>
                  <div>Create targeted Google search URLs</div>
                </div>
                <div className="bg-white/80 p-4 rounded-lg border">
                  <div className="font-medium text-green-600 mb-1">📊 Step 2: Scrape Data</div>
                  <div>Use browser extensions to collect data</div>
                </div>
                <div className="bg-white/80 p-4 rounded-lg border">
                  <div className="font-medium text-purple-600 mb-1">🧹 Step 3: Clean & Export</div>
                  <div>Process and export clean lead lists</div>
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
