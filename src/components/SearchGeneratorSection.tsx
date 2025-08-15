import { Search, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SearchGeneratorSectionProps {
  category: string;
  city: string;
  generatedUrl: string;
  urlCopied: boolean;
  onCategoryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onGenerateUrl: () => void;
  onCopyUrl: () => void;
  onOpenInGoogle: () => void;
}

const SearchGeneratorSection = ({
  category,
  city,
  generatedUrl,
  urlCopied,
  onCategoryChange,
  onCityChange,
  onGenerateUrl,
  onCopyUrl,
  onOpenInGoogle,
}: SearchGeneratorSectionProps) => {
  return (
    <Card className="glass border-purple-200/30 dark:border-purple-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Search className="h-5 w-5" />
          Generate Google Search URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search-category">Category</Label>
            <Input
              id="search-category"
              placeholder="e.g., Restaurant, Fashion, Fitness"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="glass border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="search-city">City</Label>
            <Input
              id="search-city"
              placeholder="e.g., New York, London, Tokyo"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="glass border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>

        <Button
          onClick={onGenerateUrl}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          <Search className="h-4 w-4 mr-2" />
          Generate Search URL
        </Button>

        {generatedUrl && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg glass border border-gray-200 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated URL:</p>
            <div className="flex gap-2">
              <Input
                value={generatedUrl}
                readOnly
                className="flex-1 font-mono text-xs glass border-gray-300 dark:border-gray-600"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={onCopyUrl}
                className="flex items-center gap-1 glass border-gray-300 dark:border-gray-600"
              >
                {urlCopied ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={onOpenInGoogle}
                className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use this URL in Google to search for Instagram leads. Copy the results and paste them above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchGeneratorSection;