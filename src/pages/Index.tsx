import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Search, Upload, Download, Users, CheckCircle, AlertCircle, Trash2, Leaf } from 'lucide-react';
import { InstagramLead } from '@/types/InstagramLead';
import DataHistory from '@/components/DataHistory';
import SolutionsSection from '@/components/SolutionsSection';

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
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [rawData, setRawData] = useState('');
  const [confirmedLeads, setConfirmedLeads] = useState<InstagramLead[]>([]);
  const [unconfirmedLeads, setUnconfirmedLeads] = useState<InstagramLead[]>([]);
  const [dataHistory, setDataHistory] = useState<DataHistoryItem[]>([]);

  const openInEcosia = () => {
    if (!category || !city) {
      toast({
        title: "Missing Information",
        description: "Please enter both category and city before searching.",
        variant: "destructive",
      });
      return;
    }

    const searchQuery = `${category} ${city} instagram site:instagram.com`;
    const ecosiaUrl = `https://www.ecosia.org/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(ecosiaUrl, '_blank');
    
    toast({
      title: "🌿 Search Opened in Ecosia",
      description: "Your search is helping plant trees! Copy the Instagram profiles you find and paste them below.",
    });
  };

  const parseInstagramData = useCallback((data: string): { confirmed: InstagramLead[]; unconfirmed: InstagramLead[] } => {
    const lines = data.split('\n').filter(line => line.trim());
    const confirmed: InstagramLead[] = [];
    const unconfirmed: InstagramLead[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Try to extract Instagram username from various formats
      let username = '';
      let followers = '';
      let bio = '';

      // Pattern 1: Direct Instagram URL
      const urlMatch = trimmedLine.match(/instagram\.com\/([^\/\s?]+)/);
      if (urlMatch) {
        username = urlMatch[1];
      }
      
      // Pattern 2: @username format
      const atMatch = trimmedLine.match(/@([a-zA-Z0-9._]+)/);
      if (atMatch && !username) {
        username = atMatch[1];
      }

      // Pattern 3: Just username
      if (!username && /^[a-zA-Z0-9._]+$/.test(trimmedLine.split(' ')[0])) {
        username = trimmedLine.split(' ')[0];
      }

      // Extract follower count if present
      const followerMatch = trimmedLine.match(/(\d+(?:,\d+)*)\s*(?:followers?|k|m)/i);
      if (followerMatch) {
        followers = followerMatch[1];
      }

      // Extract bio/description
      const bioMatch = trimmedLine.match(/["|']([^"']+)["|']/);
      if (bioMatch) {
        bio = bioMatch[1];
      }

      if (username) {
        const lead: InstagramLead = {
          id: `${username}-${index}`,
          username: username.replace('@', ''),
          profileUrl: `https://instagram.com/${username.replace('@', '')}`,
          followers: followers || 'Unknown',
          bio: bio || trimmedLine.replace(urlMatch?.[0] || '', '').replace(atMatch?.[0] || '', '').trim(),
          category: category || 'Unknown',
          city: city || 'Unknown',
          isConfirmed: false
        };

        // Auto-confirm if it looks like a proper Instagram profile
        if (urlMatch || (atMatch && followers)) {
          lead.isConfirmed = true;
          confirmed.push(lead);
        } else {
          unconfirmed.push(lead);
        }
      }
    });

    return { confirmed, unconfirmed };
  }, [category, city]);

  const handleDataSubmit = () => {
    if (!rawData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste some Instagram profile data first.",
        variant: "destructive",
      });
      return;
    }

    const { confirmed, unconfirmed } = parseInstagramData(rawData);
    setConfirmedLeads(confirmed);
    setUnconfirmedLeads(unconfirmed);

    // Save to history
    const historyItem: DataHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      category: category || 'Unknown',
      city: city || 'Unknown',
      confirmedCount: confirmed.length,
      unconfirmedCount: unconfirmed.length,
      data: { confirmed, unconfirmed }
    };

    setDataHistory(prev => [historyItem, ...prev]);

    toast({
      title: "Data Processed Successfully! 🎉",
      description: `Found ${confirmed.length} confirmed and ${unconfirmed.length} unconfirmed leads.`,
    });
  };

  const confirmLead = (id: string) => {
    const lead = unconfirmedLeads.find(l => l.id === id);
    if (lead) {
      lead.isConfirmed = true;
      setConfirmedLeads(prev => [...prev, lead]);
      setUnconfirmedLeads(prev => prev.filter(l => l.id !== id));
      
      toast({
        title: "Lead Confirmed ✅",
        description: `@${lead.username} has been moved to confirmed leads.`,
      });
    }
  };

  const removeLead = (id: string, isConfirmed: boolean) => {
    if (isConfirmed) {
      setConfirmedLeads(prev => prev.filter(l => l.id !== id));
    } else {
      setUnconfirmedLeads(prev => prev.filter(l => l.id !== id));
    }
    
    toast({
      title: "Lead Removed",
      description: "Lead has been removed from the list.",
    });
  };

  const exportToCSV = (includeUnconfirmed = false) => {
    const leadsToExport = includeUnconfirmed 
      ? [...confirmedLeads, ...unconfirmedLeads]
      : confirmedLeads;

    if (leadsToExport.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please process some data first.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Username', 'Profile URL', 'Followers', 'Bio', 'Category', 'City', 'Status'].join(','),
      ...leadsToExport.map(lead => [
        lead.username,
        lead.profileUrl,
        lead.followers,
        `"${lead.bio.replace(/"/g, '""')}"`,
        lead.category,
        lead.city,
        lead.isConfirmed ? 'Confirmed' : 'Unconfirmed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram-leads-${category}-${city}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful! 📊",
      description: `Exported ${leadsToExport.length} leads to CSV file.`,
    });
  };

  const loadHistoryData = (item: DataHistoryItem) => {
    setConfirmedLeads(item.data.confirmed);
    setUnconfirmedLeads(item.data.unconfirmed);
    setCategory(item.category);
    setCity(item.city);
    
    toast({
      title: "Data Loaded",
      description: `Loaded ${item.confirmedCount} confirmed and ${item.unconfirmedCount} unconfirmed leads.`,
    });
  };

  const deleteHistoryItem = (id: string) => {
    setDataHistory(prev => prev.filter(item => item.id !== id));
    toast({
      title: "History Item Deleted",
      description: "The data has been removed from history.",
    });
  };

  const exportHistoryItem = (item: DataHistoryItem, includeUnconfirmed: boolean) => {
    const leadsToExport = includeUnconfirmed 
      ? [...item.data.confirmed, ...item.data.unconfirmed]
      : item.data.confirmed;

    const csvContent = [
      ['Username', 'Profile URL', 'Followers', 'Bio', 'Category', 'City', 'Status'].join(','),
      ...leadsToExport.map(lead => [
        lead.username,
        lead.profileUrl,
        lead.followers,
        `"${lead.bio.replace(/"/g, '""')}"`,
        lead.category,
        lead.city,
        lead.isConfirmed ? 'Confirmed' : 'Unconfirmed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram-leads-${item.category}-${item.city}-${item.timestamp.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful! 📊",
      description: `Exported ${leadsToExport.length} leads from history.`,
    });
  };

  const totalLeads = confirmedLeads.length + unconfirmedLeads.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            🌿 Instagram Lead Hunter
          </h1>
          <p className="text-xl text-white/80 mb-2">
            Eco-friendly lead generation for Instagram influencers
          </p>
          <p className="text-sm text-white/60">
            Powered by Ecosia - Every search plants trees 🌱
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Search className="h-5 w-5 text-green-400" />
                <span>Search Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Category
                </label>
                <Input
                  type="text"
                  placeholder="e.g., fitness trainer, digital creator, food blogger"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass border-white/30 text-white placeholder-white/50"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  City
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Mumbai, Delhi, Bangalore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="glass border-white/30 text-white placeholder-white/50"
                />
              </div>
              <Button
                onClick={openInEcosia}
                disabled={!category || !city}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                🌿 Search on Ecosia (Plant Trees!)
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Upload className="h-5 w-5 text-blue-400" />
                <span>Data Input</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Paste Instagram Profile Data
                </label>
                <Textarea
                  placeholder="Paste Instagram usernames, URLs, or profile data here..."
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  className="glass border-white/30 text-white placeholder-white/50 min-h-[120px]"
                />
              </div>
              <Button
                onClick={handleDataSubmit}
                disabled={!rawData.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                🔍 Process Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {totalLeads > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="glass border-white/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-2xl font-bold text-white">{confirmedLeads.length}</span>
                </div>
                <p className="text-white/70 text-sm">Confirmed Leads</p>
              </CardContent>
            </Card>
            <Card className="glass border-white/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <span className="text-2xl font-bold text-white">{unconfirmedLeads.length}</span>
                </div>
                <p className="text-white/70 text-sm">Needs Review</p>
              </CardContent>
            </Card>
            <Card className="glass border-white/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{totalLeads}</span>
                </div>
                <p className="text-white/70 text-sm">Total Leads</p>
              </CardContent>
            </Card>
          </div>
        )}

        {totalLeads > 0 && (
          <Card className="glass border-white/20 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  <span>Lead Management</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => exportToCSV(false)}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export Confirmed
                  </Button>
                  {unconfirmedLeads.length > 0 && (
                    <Button
                      onClick={() => exportToCSV(true)}
                      size="sm"
                      variant="outline"
                      className="glass border-white/30 text-white hover:bg-white/10"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="confirmed" className="w-full">
                <TabsList className="glass border-white/20 mb-4">
                  <TabsTrigger value="confirmed" className="text-white data-[state=active]:bg-white/20">
                    Confirmed ({confirmedLeads.length})
                  </TabsTrigger>
                  <TabsTrigger value="unconfirmed" className="text-white data-[state=active]:bg-white/20">
                    Needs Review ({unconfirmedLeads.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="confirmed" className="space-y-3">
                  {confirmedLeads.length === 0 ? (
                    <p className="text-white/60 text-center py-8">No confirmed leads yet.</p>
                  ) : (
                    confirmedLeads.map((lead) => (
                      <div key={lead.id} className="glass rounded-lg p-4 border border-white/10 hover:border-green-400/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className="bg-green-500/20 text-green-300">
                                @{lead.username}
                              </Badge>
                              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                                {lead.followers} followers
                              </Badge>
                            </div>
                            <p className="text-white/80 text-sm mb-1">{lead.bio}</p>
                            <a 
                              href={lead.profileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 text-sm underline"
                            >
                              View Profile
                            </a>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeLead(lead.id, true)}
                            className="glass border-red-400/30 text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="unconfirmed" className="space-y-3">
                  {unconfirmedLeads.length === 0 ? (
                    <p className="text-white/60 text-center py-8">No leads need review.</p>
                  ) : (
                    unconfirmedLeads.map((lead) => (
                      <div key={lead.id} className="glass rounded-lg p-4 border border-white/10 hover:border-yellow-400/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                                @{lead.username}
                              </Badge>
                              <Badge variant="outline" className="border-white/30 text-white/70">
                                {lead.followers} followers
                              </Badge>
                            </div>
                            <p className="text-white/80 text-sm mb-1">{lead.bio}</p>
                            <a 
                              href={lead.profileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 text-sm underline"
                            >
                              View Profile
                            </a>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => confirmLead(lead.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeLead(lead.id, false)}
                              className="glass border-red-400/30 text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <SolutionsSection />

        <div className="mt-8">
          <DataHistory
            history={dataHistory}
            onLoadData={loadHistoryData}
            onDeleteItem={deleteHistoryItem}
            onExportItem={exportHistoryItem}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
