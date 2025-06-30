
import { useState } from "react";
import { Search, Download, Filter, Users, MapPin, Instagram, Loader2, Upload, ExternalLink, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";

interface InstagramLead {
  id: string;
  url: string;
  brandName: string;
  userId: string;
  followers: number;
  category: string;
  city: string;
  confidence: 'high' | 'medium' | 'low';
}

const Index = () => {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [rawData, setRawData] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [leads, setLeads] = useState<InstagramLead[]>([]);
  const [unconfirmedLeads, setUnconfirmedLeads] = useState<InstagramLead[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState<"followers" | "brandName">("followers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [urlCopied, setUrlCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
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
    // Add random parameters to avoid bot detection
    const randomParam = Math.random().toString(36).substring(7);
    const url = `https://www.google.com/search?q=${encodedQuery}&num=100&hl=en&safe=off&filter=0&pws=0&gl=us&uule=&lr=&cr=&tbs=&tbm=&source=lnt&sa=X&ved=&biw=1920&bih=1080&dpr=1&t=${Date.now()}&rand=${randomParam}`;
    
    setGeneratedUrl(url);
    toast({
      title: "Search URL Generated!",
      description: "Copy the URL and use it in an incognito window to avoid bot detection."
    });
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
      toast({
        title: "URL Copied!",
        description: "Use this URL in an incognito window with manual user-agent rotation."
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
      // Open in new incognito-style window to reduce bot detection
      const newWindow = window.open();
      if (newWindow) {
        newWindow.opener = null;
        newWindow.location = generatedUrl;
      }
    }
  };

  const parseInstagramData = (data: string): { confirmed: InstagramLead[], unconfirmed: InstagramLead[] } => {
    const lines = data.split('\n').filter(line => line.trim());
    const confirmedLeads: InstagramLead[] = [];
    const unconfirmedLeads: InstagramLead[] = [];
    const seenUrls = new Set<string>();
    const seenProfiles = new Set<string>();

    lines.forEach((line, index) => {
      // Enhanced regex for better Instagram URL detection
      const instagramUrlMatches = line.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p\/[^\/\s,"]+|reel\/[^\/\s,"]+|[^\/\s,"]+)/g);
      
      if (instagramUrlMatches) {
        instagramUrlMatches.forEach(fullUrl => {
          const cleanUrl = fullUrl.split('?')[0].replace(/\/$/, '');
          
          // Skip if we've already seen this URL
          if (seenUrls.has(cleanUrl)) return;
          seenUrls.add(cleanUrl);

          let userId = '';
          let brandName = '';
          let confidence: 'high' | 'medium' | 'low' = 'medium';

          // Extract user ID and determine confidence
          if (cleanUrl.includes('/p/') || cleanUrl.includes('/reel/')) {
            // For posts/reels, try to extract username from context
            const usernameMatch = line.match(/@([a-zA-Z0-9._]+)/);
            if (usernameMatch) {
              userId = usernameMatch[1];
              confidence = 'low';
            } else {
              // Try to extract from surrounding text
              const contextMatch = line.match(/instagram\.com\/([^\/\s,"]+)/);
              if (contextMatch) {
                userId = contextMatch[1];
                confidence = 'low';
              }
            }
          } else {
            // Direct profile URL
            const urlParts = cleanUrl.split('/');
            userId = urlParts[3] || '';
            confidence = 'high';
          }

          // Skip if we've already processed this profile
          if (seenProfiles.has(userId)) return;
          seenProfiles.add(userId);

          // Extract brand name
          brandName = userId.replace(/_/g, ' ').replace(/\./g, ' ');
          brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

          // Try to extract follower count with better regex
          let followers = 0;
          const followerPatterns = [
            /([\d,]+\.?\d*)\s*(K|M|k|m)?\s*followers?/i,
            /([\d,]+\.?\d*)\s*(K|M|k|m)?\s*subscriber/i,
            /(\d{1,3}(?:,\d{3})*)\s*followers?/i
          ];

          for (const pattern of followerPatterns) {
            const followerMatch = line.match(pattern);
            if (followerMatch) {
              let number = parseFloat(followerMatch[1].replace(/,/g, ''));
              const unit = followerMatch[2]?.toUpperCase();
              if (unit === 'K') number *= 1000;
              if (unit === 'M') number *= 1000000;
              followers = Math.round(number);
              break;
            }
          }

          const lead: InstagramLead = {
            id: `${index}-${userId}-${Date.now()}`,
            url: cleanUrl,
            brandName,
            userId,
            followers,
            category,
            city,
            confidence
          };

          if (confidence === 'high' || confidence === 'medium') {
            confirmedLeads.push(lead);
          } else {
            unconfirmedLeads.push(lead);
          }
        });
      }
    });

    return { confirmed: confirmedLeads, unconfirmed: unconfirmedLeads };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or TXT file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawData(content);
      toast({
        title: "File Uploaded Successfully",
        description: `${file.name} has been loaded. Click 'Clean & Filter Data' to process.`
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload Failed",
        description: "There was an error reading the file. Please try again.",
        variant: "destructive"
      });
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or TXT file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawData(content);
      toast({
        title: "File Uploaded Successfully",
        description: `${file.name} has been loaded. Click 'Clean & Filter Data' to process.`
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload Failed",
        description: "There was an error reading the file. Please try again.",
        variant: "destructive"
      });
    };
    reader.readAsText(file);
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

    setTimeout(() => {
      const { confirmed, unconfirmed } = parseInstagramData(rawData);
      
      // Apply follower filter if specified
      let filteredConfirmed = confirmed;
      let filteredUnconfirmed = unconfirmed;
      
      if (minFollowers && parseInt(minFollowers) > 0) {
        const minCount = parseInt(minFollowers);
        filteredConfirmed = confirmed.filter(lead => 
          lead.followers >= minCount || lead.followers === 0
        );
        filteredUnconfirmed = unconfirmed.filter(lead => 
          lead.followers >= minCount || lead.followers === 0
        );
      }

      setLeads(filteredConfirmed);
      setUnconfirmedLeads(filteredUnconfirmed);
      setIsProcessing(false);

      toast({
        title: "Data Processed Successfully!",
        description: `Found ${filteredConfirmed.length} confirmed leads and ${filteredUnconfirmed.length} unconfirmed leads.`
      });
    }, 2000);
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

  const filteredAndSortedUnconfirmed = unconfirmedLeads
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

  const handleExport = (format: "csv" | "excel", includeUnconfirmed: boolean = false) => {
    const dataToExport = includeUnconfirmed 
      ? [...filteredAndSortedLeads, ...filteredAndSortedUnconfirmed]
      : filteredAndSortedLeads;

    const headers = ["Brand Name", "Instagram URL", "User ID", "Followers", "Category", "City", "Confidence"];
    const csvData = [
      headers.join(","),
      ...dataToExport.map(lead => 
        [
          `"${lead.brandName}"`,
          lead.url,
          lead.userId,
          lead.followers,
          `"${lead.category}"`,
          `"${lead.city}"`,
          lead.confidence
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagram-leads-${category}-${city}-${includeUnconfirmed ? 'all' : 'confirmed'}.${format === "csv" ? "csv" : "xlsx"}`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete!",
      description: `Downloaded ${dataToExport.length} leads as ${format.toUpperCase()}.`
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-xl">
                <Instagram className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Instagram Lead Finder Pro
                </h1>
                <p className="text-white/80 mt-1">Advanced semi-automated lead generation with smart parsing</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Step 1: URL Generation */}
        <Card className="glass border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Search className="h-5 w-5 text-blue-400" />
              <span>Step 1: Generate Search URL</span>
            </CardTitle>
            <CardDescription className="text-white/70">
              Enter your search criteria to generate a bot-resistant Google search URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Business Category</span>
                </label>
                <Input
                  placeholder="e.g., Skin Clinic, Restaurant, Gym"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass border-white/30 text-white placeholder:text-white/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>City</span>
                </label>
                <Input
                  placeholder="e.g., Mumbai, Delhi, Bangalore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="glass border-white/30 text-white placeholder:text-white/50"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={generateSearchUrl}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2.5"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Generate Search URL
                </Button>
              </div>
            </div>

            {generatedUrl && (
              <div className="mt-6 p-4 glass rounded-lg border border-blue-400/30">
                <label className="text-sm font-medium text-blue-200 mb-2 block">Generated Search URL:</label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={generatedUrl}
                    readOnly
                    className="flex-1 glass border-blue-400/30 text-white text-sm"
                  />
                  <Button
                    onClick={copyUrl}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1 glass border-white/30 text-white hover:bg-white/10"
                  >
                    {urlCopied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    <span>{urlCopied ? "Copied!" : "Copy"}</span>
                  </Button>
                  <Button
                    onClick={openInGoogle}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1 glass border-white/30 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open</span>
                  </Button>
                </div>
                <p className="text-xs text-blue-200 mt-2">
                  💡 Use in incognito mode with random delays between page loads. URL includes anti-bot parameters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Data Input */}
        <Card className="glass border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Upload className="h-5 w-5 text-green-400" />
              <span>Step 2: Upload Scraped Data</span>
            </CardTitle>
            <CardDescription className="text-white/70">
              Paste your scraped data or upload a CSV file from your scraping extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Paste Scraped Data Here:</label>
                <Textarea
                  placeholder="Paste your scraped Instagram data here (URLs, brand names, follower counts, etc.)"
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  className="h-32 resize-none glass border-white/30 text-white placeholder:text-white/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Or Upload CSV File:</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all glass ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-400/10' 
                      : 'border-white/30 hover:border-white/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-blue-400' : 'text-white/60'}`} />
                  <p className="text-sm text-white/70 mb-2">
                    {isDragOver ? 'Drop your file here' : 'Drag & drop your CSV file here'}
                  </p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" className="cursor-pointer glass border-white/30 text-white hover:bg-white/10">
                      Choose File
                    </Button>
                  </label>
                  <p className="text-xs text-white/50 mt-2">CSV or TXT files only</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-white/90">Minimum Followers (optional):</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  className="w-32 glass border-white/30 text-white placeholder:text-white/50"
                />
              </div>
              <Button
                onClick={cleanAndFilterData}
                disabled={isProcessing || !rawData.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
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
        {(leads.length > 0 || unconfirmedLeads.length > 0) && (
          <>
            {/* Confirmed Results */}
            <Card className="glass border-white/20">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Instagram className="h-5 w-5 text-green-400" />
                      <span>Confirmed Results</span>
                    </CardTitle>
                    <Badge variant="secondary" className="px-3 py-1 bg-green-500/20 text-green-300">
                      {filteredAndSortedLeads.length} high-confidence leads
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                      <Input
                        placeholder="Filter by name or username..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="pl-10 w-64 glass border-white/30 text-white placeholder:text-white/50"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleExport("csv", false)}
                      className="flex items-center space-x-2 glass border-white/30 text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export CSV</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="glass border-white/20">
                        <TableHead 
                          className="cursor-pointer hover:bg-white/10 transition-colors font-semibold text-white/90"
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
                        <TableHead className="text-white/90">Instagram Profile</TableHead>
                        <TableHead className="text-white/90">Username</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-white/10 transition-colors font-semibold text-white/90"
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
                        <TableHead className="text-white/90">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedLeads.map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-white/5 transition-colors border-white/10">
                          <TableCell className="font-medium text-white">{lead.brandName}</TableCell>
                          <TableCell>
                            <a 
                              href={lead.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-2"
                            >
                              <Instagram className="h-4 w-4" />
                              <span>View Profile</span>
                            </a>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-white/80">@{lead.userId}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white">{formatFollowers(lead.followers)}</span>
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
                          <TableCell>
                            <Badge 
                              variant={lead.confidence === 'high' ? 'default' : 'secondary'}
                              className={lead.confidence === 'high' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}
                            >
                              {lead.confidence}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Unconfirmed Results */}
            {unconfirmedLeads.length > 0 && (
              <Card className="glass border-yellow-400/30">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <CardTitle className="flex items-center space-x-2 text-white">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        <span>Unconfirmed Results</span>
                      </CardTitle>
                      <Badge variant="secondary" className="px-3 py-1 bg-yellow-500/20 text-yellow-300">
                        {filteredAndSortedUnconfirmed.length} low-confidence leads
                      </Badge>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleExport("csv", true)}
                      className="flex items-center space-x-2 glass border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/10"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export All</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="glass border-yellow-400/20">
                          <TableHead className="text-white/90">Brand Name</TableHead>
                          <TableHead className="text-white/90">Instagram Profile</TableHead>
                          <TableHead className="text-white/90">Username</TableHead>
                          <TableHead className="text-white/90">Followers</TableHead>
                          <TableHead className="text-white/90">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedUnconfirmed.map((lead) => (
                          <TableRow key={lead.id} className="hover:bg-yellow-400/5 transition-colors border-yellow-400/10">
                            <TableCell className="font-medium text-white">{lead.brandName}</TableCell>
                            <TableCell>
                              <a 
                                href={lead.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-yellow-400 hover:text-yellow-300 hover:underline flex items-center space-x-2"
                              >
                                <Instagram className="h-4 w-4" />
                                <span>View Profile</span>
                              </a>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-white/80">@{lead.userId}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-white">{formatFollowers(lead.followers)}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                                {lead.confidence}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {leads.length === 0 && unconfirmedLeads.length === 0 && !isProcessing && (
          <Card className="text-center py-12 glass border-white/20 border-dashed border-2">
            <CardContent>
              <Instagram className="h-16 w-16 text-white/60 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Ready to Find Instagram Leads</h3>
              <p className="text-white/70 mb-6">
                Follow the 3-step process: Generate URL → Scrape Data → Clean & Export
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm text-white/70">
                <div className="glass p-4 rounded-lg border border-white/20">
                  <div className="font-medium text-blue-300 mb-1">🔗 Step 1: Generate URL</div>
                  <div>Create bot-resistant Google search URLs</div>
                </div>
                <div className="glass p-4 rounded-lg border border-white/20">
                  <div className="font-medium text-green-300 mb-1">📊 Step 2: Scrape Data</div>
                  <div>Use browser extensions to collect data safely</div>
                </div>
                <div className="glass p-4 rounded-lg border border-white/20">
                  <div className="font-medium text-purple-300 mb-1">🧹 Step 3: Clean & Export</div>
                  <div>Process and export clean lead lists with confidence scoring</div>
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
