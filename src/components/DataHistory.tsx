
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Clock, Database } from 'lucide-react';
import { InstagramLead } from '@/types/InstagramLead';

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

interface DataHistoryProps {
  history: DataHistoryItem[];
  onLoadData: (item: DataHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onExportItem: (item: DataHistoryItem, includeUnconfirmed: boolean) => void;
}

const DataHistory: React.FC<DataHistoryProps> = ({
  history,
  onLoadData,
  onDeleteItem,
  onExportItem
}) => {
  if (history.length === 0) {
    return (
      <Card className="glass border-white/20">
        <CardContent className="text-center py-8">
          <Database className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/70">No past data found. Start by cleaning your first dataset!</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="glass border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Clock className="h-5 w-5 text-purple-400" />
          <span>Data History</span>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
            {history.length} saved
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="glass rounded-lg p-4 border border-white/10 hover:border-purple-400/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-white">{item.category} - {item.city}</h4>
                <p className="text-sm text-white/60 flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(item.timestamp)}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-500/20 text-green-300">
                  {item.confirmedCount} confirmed
                </Badge>
                {item.unconfirmedCount > 0 && (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                    {item.unconfirmedCount} unconfirmed
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => onLoadData(item)}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
              >
                Load Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExportItem(item, false)}
                className="glass border-white/30 text-white hover:bg-white/10"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              {item.unconfirmedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onExportItem(item, true)}
                  className="glass border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/10"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export All
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeleteItem(item.id)}
                className="glass border-red-400/30 text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DataHistory;
