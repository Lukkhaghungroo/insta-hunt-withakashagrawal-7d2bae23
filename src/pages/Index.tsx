import { useState, useEffect } from "react";
import { Search, Download, Filter, Users, MapPin, Instagram, Loader2, Upload, ExternalLink, Copy, CheckCircle, AlertTriangle, History, BarChart3, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import DataHistory from "@/components/DataHistory";
import SmartSearch from "@/components/SmartSearch";
import DatabaseManager from "@/components/DatabaseManager";
import QATestingSuite from "@/components/QATestingSuite";
import ComprehensiveQA from "@/components/ComprehensiveQA";
import { InstagramLead } from "@/types/InstagramLead";
import { parseFollowerCount, extractUsernameFromUrl, formatBrandName, extractProfileInfo, resolveFollowers } from "@/utils/followerExtractor";
import { useProfiles } from "@/hooks/useProfiles";
import { filterAndSortLeads, validateMinFollowers } from "@/utils/dataFiltering";

interface DataHistoryItem {
  id: string;
  timestamp: Date;
  category: string;
  city: string;
  confirmedCount: number;
  unconfirmedCount: number;
  data: {
    confirmed: InstagramLead[];
    unconfirmed: InstagramLead[];
  };
}

const Index = () => {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [rawData, setRawData] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [minFollowersError, setMinFollowersError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [leads, setLeads] = useState<InstagramLead[]>([]);
  const [unconfirmedLeads, setUnconfirmedLeads] = useState<InstagramLead[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState<"followers" | "brandName">("followers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [urlCopied, setUrlCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dataHistory, setDataHistory] = useState<DataHistoryItem[]>([]);
  const { toast } = useToast();
  const { saveProfilesToDatabase, loading: dbLoading } = useProfiles();

  // Load data history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('instagram-lead-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setDataHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Error loading data history:', error);
      }
    }
  }, []);

  // Save data history to localStorage whenever it changes
  useEffect(() => {
    if (dataHistory.length > 0) {
      localStorage.setItem('instagram-lead-history', JSON.stringify(dataHistory));
    }
  }, [dataHistory]);

  const generateSearchUrl = () => {
    if (!category.trim() || !city.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both category and city to generate search URL.",
        variant: "destructive"
      });
      return;
    }

    // Generate Google search URL with num=100 parameter
    const searchQuery = `site:instagram.com "${category.trim()}" "${city.trim()}"`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Create Google search URL with 100 results
    const url = `https://www.google.com/search?q=${encodedQuery}&num=100`;
    
    setGeneratedUrl(url);
    toast({
      title: "Google Search URL Generated!",
      description: "URL optimized for Google search with 100 results per page.",
    });
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
      toast({
        title: "URL Copied!",
        description: "Use this URL in Google to search for Instagram leads."
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

    // Check if data appears to be CSV format
    const isCSV = lines.length > 0 && lines[0].includes(',') && lines[0].toLowerCase().includes('url');
    
    console.log('Data format detected:', isCSV ? 'CSV' : 'Raw text');
    console.log('Processing', lines.length, 'lines of data');

    if (isCSV) {
      // Handle CSV format with improved parsing
      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
      
      const urlIndex = headers.findIndex(h => h.includes('url') || h.includes('instagram'));
      const followerIndex = headers.findIndex(h => h.includes('follower') || h.includes('likes'));
      
      console.log('CSV Headers:', headers);
      console.log('URL column index:', urlIndex, 'Follower column index:', followerIndex);

      dataLines.forEach((line, index) => {
        if (!line.trim()) return;
        
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        if (urlIndex >= 0 && urlIndex < columns.length) {
          const url = columns[urlIndex];
          const followerText = followerIndex >= 0 && followerIndex < columns.length ? columns[followerIndex] : '';
          
          // Check if URL is an Instagram URL
          const instagramUrlMatch = url.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p\/[^\/\s,"]+|reel\/[^\/\s,"]+|([^\/\s,"]+))/);
          
          if (instagramUrlMatch) {
            const cleanUrl = url.split('?')[0].replace(/\/$/, '');
            
            if (seenUrls.has(cleanUrl)) return;
            seenUrls.add(cleanUrl);

            // Use enhanced profile extraction
            const profileInfo = extractProfileInfo(line, cleanUrl);
            const { username: userId, brandName, confidence } = profileInfo;

            if (!userId || seenProfiles.has(userId)) return;
            seenProfiles.add(userId);

            // Optimized follower resolution: prefer scraped column, then line
            const followers = resolveFollowers(followerText || undefined, line);

            const lead: InstagramLead = {
              id: `${index}-${userId}-${Date.now()}`,
              url: cleanUrl,
              brandName,
              userId,
              followers,
              category: category || 'Unknown',
              city: city || 'Unknown',
              confidence
            };

            if (confidence === 'high' || confidence === 'medium') {
              confirmedLeads.push(lead);
            } else {
              unconfirmedLeads.push(lead);
            }
          }
        }
      });
    } else {
      // Handle raw text format with improved parsing
      lines.forEach((line, index) => {
        const instagramUrlMatches = line.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p\/[^\/\s,"]+|reel\/[^\/\s,"]+|[^\/\s,"]+)/g);
        
        if (instagramUrlMatches) {
          instagramUrlMatches.forEach(fullUrl => {
            const cleanUrl = fullUrl.split('?')[0].replace(/\/$/, '');
            
            if (seenUrls.has(cleanUrl)) return;
            seenUrls.add(cleanUrl);

            // Use enhanced profile extraction
            const profileInfo = extractProfileInfo(line, cleanUrl);
            const { username: userId, brandName, confidence } = profileInfo;

            if (!userId || seenProfiles.has(userId)) return;
            seenProfiles.add(userId);

            // Optimized follower resolution from line only
            const followers = resolveFollowers(undefined, line);

            const lead: InstagramLead = {
              id: `${index}-${userId}-${Date.now()}`,
              url: cleanUrl,
              brandName,
              userId,
              followers,
              category: category || 'Unknown',
              city: city || 'Unknown',
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
    }

    console.log('Parsing complete:', {
      confirmedLeads: confirmedLeads.length,
      unconfirmedLeads: unconfirmedLeads.length,
      totalProcessed: confirmedLeads.length + unconfirmedLeads.length
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
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const saveDataToHistory = (confirmedLeads: InstagramLead[], unconfirmedLeads: InstagramLead[]) => {
    const historyItem: DataHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      category,
      city,
      confirmedCount: confirmedLeads.length,
      unconfirmedCount: unconfirmedLeads.length,
      data: {
        confirmed: confirmedLeads,
        unconfirmed: unconfirmedLeads
      }
    };

    setDataHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep only last 10 items
  };

  // Handle minimum followers input change with validation
  const handleMinFollowersChange = (value: string) => {
    setMinFollowers(value);
    const validation = validateMinFollowers(value);
    setMinFollowersError(validation.error || "");
  };

  const cleanAndFilterData = async () => {
    if (!rawData.trim()) {
      toast({
        title: "No Data Found",
        description: "Please paste your scraped data or upload a CSV file first.",
        variant: "destructive"
      });
      return;
    }

    // Validate minimum followers before processing
    const validation = validateMinFollowers(minFollowers);
    if (!validation.isValid) {
      toast({
        title: "Invalid Input",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
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

      // Save to database
      try {
        await saveProfilesToDatabase({
          category: category || 'Unknown',
          city: city || 'Unknown',
          confirmedProfiles: filteredConfirmed,
          unconfirmedProfiles: filteredUnconfirmed,
        });
      } catch (error) {
        console.error('Error saving to database:', error);
      }
      
      // Save to history
      if (filteredConfirmed.length > 0 || filteredUnconfirmed.length > 0) {
        saveDataToHistory(filteredConfirmed, filteredUnconfirmed);
      }
      
      setIsProcessing(false);

      toast({
        title: "Data Processed Successfully!",
        description: `Found ${filteredConfirmed.length} confirmed leads and ${filteredUnconfirmed.length} unconfirmed leads. Saved to database.`
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

  const openProfileAnalytics = (username: string) => {
    const analyticsUrl = `https://app.notjustanalytics.com/analysis/${username}`;
    window.open(analyticsUrl, '_blank', 'noopener,noreferrer');
  };

  // Use utility function to reduce code duplication
  const filteredAndSortedLeads = filterAndSortLeads(leads, searchFilter, sortBy, sortOrder);
  const filteredAndSortedUnconfirmed = filterAndSortLeads(unconfirmedLeads, searchFilter, sortBy, sortOrder);

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

  const loadHistoryData = (item: DataHistoryItem) => {
    setLeads(item.data.confirmed);
    setUnconfirmedLeads(item.data.unconfirmed);
    setCategory(item.category);
    setCity(item.city);
    toast({
      title: "Data Loaded Successfully!",
      description: `Loaded ${item.confirmedCount} confirmed and ${item.unconfirmedCount} unconfirmed leads.`
    });
  };

  const deleteHistoryItem = (id: string) => {
    setDataHistory(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Data Deleted",
      description: "History item has been removed."
    });
  };

  const exportHistoryItem = (item: DataHistoryItem, includeUnconfirmed: boolean) => {
    const dataToExport = includeUnconfirmed 
      ? [...item.data.confirmed, ...item.data.unconfirmed]
      : item.data.confirmed;

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
    a.download = `instagram-leads-${item.category}-${item.city}-${includeUnconfirmed ? 'all' : 'confirmed'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete!",
      description: `Downloaded ${dataToExport.length} leads from history.`
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass border-b border-white/20 dark:border-white/20 border-gray-200 shadow-lg gothic-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl gothic-glow">
                <Instagram className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent gothic-glow">
                  Instagram Lead Finder Pro
                </h1>
                <p className="text-gray-600 dark:text-white/80 mt-1 gothic-accent">Advanced semi-automated lead generation with smart parsing</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-5 glass border-white/20 dark:border-white/20 border-gray-200">
            <TabsTrigger value="generator" className="text-gray-800 dark:text-white">Fresh Scrape</TabsTrigger>
            <TabsTrigger value="smart-search" className="text-gray-800 dark:text-white">Smart Search</TabsTrigger>
            <TabsTrigger value="database" className="text-gray-800 dark:text-white">Database</TabsTrigger>
            <TabsTrigger value="history" className="text-gray-800 dark:text-white">History</TabsTrigger>
            <TabsTrigger value="qa" className="text-gray-800 dark:text-white">QA Tests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="space-y-8">
            {/* Step 1: URL Generation */}
            <Card className="glass border-white/20 dark:border-white/20 border-gray-200 gothic-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-white gothic-glow">
                  <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span>Step 1: Generate Google Search URL</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-white/70">
                  Generate optimized search URLs for Google with 100 results per page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/90 flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Business Category</span>
                    </label>
                    <Input
                      placeholder="e.g., Skin Clinic, Restaurant, Gym"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/90 flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>City</span>
                    </label>
                    <Input
                      placeholder="e.g., Mumbai, Delhi, Bangalore"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={generateSearchUrl}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-2.5"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Generate Google URL
                    </Button>
                  </div>
                </div>

                {generatedUrl && (
                  <div className="mt-6 p-4 glass rounded-lg border border-green-400/30 gothic-border">
                    <label className="text-sm font-medium text-green-600 dark:text-green-200 mb-2 block gothic-accent">Google Search URL (100 Results):</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={generatedUrl}
                        readOnly
                        className="flex-1 glass border-green-400/30 text-gray-800 dark:text-white text-sm"
                      />
                      <Button
                        onClick={copyUrl}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                      >
                        {urlCopied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        <span>{urlCopied ? "Copied!" : "Copy"}</span>
                      </Button>
                      <Button
                        onClick={openInGoogle}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open</span>
                      </Button>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-200 mt-2">
                      🔍 Google search with 100 results per page for comprehensive lead discovery
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Data Input */}
            <Card className="glass border-white/20 dark:border-white/20 border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
                  <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span>Step 2: Upload Scraped Data</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-white/70">
                  Paste your scraped data or upload a CSV file from your scraping extension
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/90">Paste Scraped Data Here:</label>
                    <Textarea
                      placeholder="Paste your scraped Instagram data here (URLs, brand names, follower counts, etc.)"
                      value={rawData}
                      onChange={(e) => setRawData(e.target.value)}
                      className="h-32 resize-none glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-white/90">Or Upload CSV File:</label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all glass ${
                        isDragOver 
                          ? 'border-blue-400 bg-blue-400/10' 
                          : 'border-gray-300 dark:border-white/30 hover:border-gray-400 dark:hover:border-white/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-blue-400' : 'text-gray-500 dark:text-white/60'}`} />
                      <p className="text-sm text-gray-600 dark:text-white/70 mb-2">
                        {isDragOver ? 'Drop your file here' : 'Drag & drop your CSV file here'}
                      </p>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="cursor-pointer glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        asChild
                      >
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-2">CSV or TXT files only</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 pt-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-white/90">Minimum Followers (optional):</label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={minFollowers}
                        onChange={(e) => handleMinFollowersChange(e.target.value)}
                        className={`w-32 glass ${minFollowersError 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-white/30'
                        } text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50`}
                      />
                    </div>
                    {minFollowersError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{minFollowersError}</p>
                    )}
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
                <Card className="glass border-white/20 dark:border-white/20 border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
                          <Instagram className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span>Confirmed Results</span>
                        </CardTitle>
                        <Badge variant="secondary" className="px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-300">
                          {filteredAndSortedLeads.length} high-confidence leads
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60" />
                          <Input
                            placeholder="Filter by name or username..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="pl-10 w-64 glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleExport("csv", false)}
                          className="flex items-center space-x-2 glass border-gray-300 dark:border-white/30 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
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
                          <TableRow className="glass border-white/20 dark:border-white/20 border-gray-200">
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-semibold text-gray-800 dark:text-white/90"
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
                            <TableHead className="text-gray-800 dark:text-white/90">Instagram Profile</TableHead>
                            <TableHead className="text-gray-800 dark:text-white/90">Username</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-semibold text-gray-800 dark:text-white/90"
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
                            <TableHead className="text-gray-800 dark:text-white/90">Confidence</TableHead>
                            <TableHead className="text-gray-800 dark:text-white/90">Analytics</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedLeads.map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-gray-200 dark:border-white/10">
                              <TableCell className="font-medium text-gray-800 dark:text-white">{lead.brandName}</TableCell>
                              <TableCell>
                                <a 
                                  href={lead.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline flex items-center space-x-2"
                                >
                                  <Instagram className="h-4 w-4" />
                                  <span>View Profile</span>
                                </a>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-600 dark:text-white/80">@{lead.userId}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-gray-800 dark:text-white">{formatFollowers(lead.followers)}</span>
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
                                  className={lead.confidence === 'high' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'}
                                >
                                  {lead.confidence}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openProfileAnalytics(lead.userId)}
                                  className="flex items-center space-x-1 glass border-purple-400/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-400/10"
                                >
                                  <BarChart3 className="h-3 w-3" />
                                  <span>Profile Analytics</span>
                                </Button>
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
                          <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <span>Unconfirmed Results</span>
                          </CardTitle>
                          <Badge variant="secondary" className="px-3 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                            {filteredAndSortedUnconfirmed.length} low-confidence leads
                          </Badge>
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleExport("csv", true)}
                          className="flex items-center space-x-2 glass border-yellow-400/30 text-yellow-600 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-400/10"
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
                              <TableHead className="text-gray-800 dark:text-white/90">Brand Name</TableHead>
                              <TableHead className="text-gray-800 dark:text-white/90">Instagram Profile</TableHead>
                              <TableHead className="text-gray-800 dark:text-white/90">Username</TableHead>
                              <TableHead className="text-gray-800 dark:text-white/90">Followers</TableHead>
                              <TableHead className="text-gray-800 dark:text-white/90">Confidence</TableHead>
                              <TableHead className="text-gray-800 dark:text-white/90">Analytics</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAndSortedUnconfirmed.map((lead) => (
                              <TableRow key={lead.id} className="hover:bg-yellow-50 dark:hover:bg-yellow-400/5 transition-colors border-yellow-400/10">
                                <TableCell className="font-medium text-gray-800 dark:text-white">{lead.brandName}</TableCell>
                                <TableCell>
                                  <a 
                                    href={lead.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300 hover:underline flex items-center space-x-2"
                                  >
                                    <Instagram className="h-4 w-4" />
                                    <span>View Profile</span>
                                  </a>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-600 dark:text-white/80">@{lead.userId}</TableCell>
                                <TableCell>
                                  <span className="font-semibold text-gray-800 dark:text-white">{formatFollowers(lead.followers)}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-400/30">
                                    {lead.confidence}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openProfileAnalytics(lead.userId)}
                                    className="flex items-center space-x-1 glass border-purple-400/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-400/10"
                                  >
                                    <BarChart3 className="h-3 w-3" />
                                    <span>Profile Analytics</span>
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
              </>
            )}

            {/* Empty State */}
            {leads.length === 0 && unconfirmedLeads.length === 0 && !isProcessing && (
              <Card className="text-center py-12 glass border-white/20 dark:border-white/20 border-gray-200 border-dashed border-2">
                <CardContent>
                  <Instagram className="h-16 w-16 text-gray-400 dark:text-white/60 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Ready to Find Instagram Leads</h3>
                  <p className="text-gray-600 dark:text-white/70 mb-6">
                    Follow the 3-step process: Generate URL → Scrape Data → Clean & Export
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm text-gray-600 dark:text-white/70">
                    <div className="glass p-4 rounded-lg border border-gray-200 dark:border-white/20">
                      <div className="font-medium text-blue-600 dark:text-blue-300 mb-1">🔗 Step 1: Generate URL</div>
                      <div>Create bot-resistant Google search URLs (India-optimized)</div>
                    </div>
                    <div className="glass p-4 rounded-lg border border-gray-200 dark:border-white/20">
                      <div className="font-medium text-green-600 dark:text-green-300 mb-1">📊 Step 2: Scrape Data</div>
                      <div>Use browser extensions to collect data safely</div>
                    </div>
                    <div className="glass p-4 rounded-lg border border-gray-200 dark:border-white/20">
                      <div className="font-medium text-purple-600 dark:text-purple-300 mb-1">🧹 Step 3: Clean & Export</div>
                      <div>Process and export clean lead lists with confidence scoring</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="smart-search" className="space-y-6">
            <SmartSearch onProfilesFound={(profiles) => setLeads(profiles)} />
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <DatabaseManager onProfilesLoaded={(profiles) => setLeads(profiles)} />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <DataHistory 
              history={dataHistory}
              onLoadData={loadHistoryData}
              onDeleteItem={deleteHistoryItem}
              onExportItem={exportHistoryItem}
            />
          </TabsContent>

          <TabsContent value="qa" className="space-y-6">
            <ComprehensiveQA />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
