import { Instagram, ExternalLink, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InstagramLead } from '@/types/InstagramLead';

interface LeadsTableProps {
  title: string;
  leads: InstagramLead[];
  onExport: (format: "csv" | "excel", includeUnconfirmed?: boolean) => void;
  onOpenProfile: (username: string) => void;
  formatFollowers: (count: number) => string;
  showExportOptions?: boolean;
}

const LeadsTable = ({
  title,
  leads,
  onExport,
  onOpenProfile,
  formatFollowers,
  showExportOptions = false,
}: LeadsTableProps) => {
  return (
    <Card className="glass border-blue-200/30 dark:border-blue-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Instagram className="h-5 w-5" />
            {title} ({leads.length})
          </CardTitle>
          {showExportOptions && leads.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport("csv")}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport("csv", true)}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Export All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {leads.length > 0 ? (
          <div className="overflow-x-auto">
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
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-medium">{lead.brandName}</TableCell>
                    <TableCell className="font-mono text-sm">{lead.userId}</TableCell>
                    <TableCell>
                      <Badge variant={lead.followers > 10000 ? "default" : "secondary"}>
                        {formatFollowers(lead.followers)}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.category}</TableCell>
                    <TableCell>{lead.city}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.confidence === 'high' ? 'default' :
                          lead.confidence === 'medium' ? 'secondary' : 'outline'
                        }
                      >
                        {lead.confidence}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(lead.url, '_blank', 'noopener,noreferrer')}
                          title="Open Instagram profile"
                        >
                          <Instagram className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onOpenProfile(lead.userId)}
                          title="Open analytics"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No leads found. Upload and process data to see results here.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadsTable;