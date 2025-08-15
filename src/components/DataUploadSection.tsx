import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { validateMinFollowers } from '@/utils/dataFiltering';

interface DataUploadSectionProps {
  category: string;
  city: string;
  rawData: string;
  minFollowers: string;
  minFollowersError: string;
  isDragOver: boolean;
  isProcessing: boolean;
  onCategoryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onRawDataChange: (value: string) => void;
  onMinFollowersChange: (value: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onCleanData: () => void;
}

const DataUploadSection = ({
  category,
  city,
  rawData,
  minFollowers,
  minFollowersError,
  isDragOver,
  isProcessing,
  onCategoryChange,
  onCityChange,
  onRawDataChange,
  onMinFollowersChange,
  onFileUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onCleanData,
}: DataUploadSectionProps) => {
  return (
    <Card className="glass border-purple-200/30 dark:border-purple-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Upload className="h-5 w-5" />
          Data Upload & Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Restaurant, Fashion, Fitness"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="glass border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g., New York, London, Tokyo"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="glass border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minFollowers">Minimum Followers (Optional)</Label>
          <Input
            id="minFollowers"
            type="number"
            placeholder="e.g., 1000"
            value={minFollowers}
            onChange={(e) => onMinFollowersChange(e.target.value)}
            className={`glass border-gray-300 dark:border-gray-600 ${minFollowersError ? 'border-red-500' : ''}`}
            min="0"
            step="1"
          />
          {minFollowersError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {minFollowersError}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Upload Data</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
            } glass`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop your CSV/TXT file here, or
            </p>
            <Button variant="outline" size="sm" className="mb-4" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.txt"
              onChange={onFileUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports CSV and TXT files with Instagram URLs
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rawData">Or Paste Raw Data</Label>
          <Textarea
            id="rawData"
            placeholder="Paste your scraped Instagram data here..."
            value={rawData}
            onChange={(e) => onRawDataChange(e.target.value)}
            rows={6}
            className="glass border-gray-300 dark:border-gray-600 resize-none font-mono text-sm"
          />
        </div>

        <Button
          onClick={onCleanData}
          disabled={!rawData.trim() || isProcessing}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
        >
          {isProcessing ? 'Processing...' : 'Clean & Filter Data'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataUploadSection;