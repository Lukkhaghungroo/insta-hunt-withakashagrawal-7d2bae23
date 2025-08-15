import { useState } from "react";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/useProfiles";
import { supabase } from "@/integrations/supabase/client"; // Import the central supabase client
import { parseFollowerCount } from '@/utils/followerExtractor';


interface QATest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: string;
}

const QATestingSuite = () => {
  const [tests, setTests] = useState<QATest[]>([
    {
      id: 'db-connection',
      name: 'Database Connection',
      description: 'Test connection to Supabase database',
      status: 'pending'
    },
    {
      id: 'profile-save',
      name: 'Profile Saving',
      description: 'Test saving profiles to database',
      status: 'pending'
    },
    {
      id: 'profile-load',
      name: 'Profile Loading',
      description: 'Test loading profiles from database',
      status: 'pending'
    },
    {
      id: 'smart-search',
      name: 'Smart Search API',
      description: 'Test smart search edge function',
      status: 'pending'
    },
    {
      id: 'ui-responsive',
      name: 'UI Component Check',
      description: 'Verify essential UI components are rendered',
      status: 'pending'
    },
    {
      id: 'data-parsing',
      name: 'Data Parsing',
      description: 'Test Instagram data parsing functionality',
      status: 'pending'
    }
  ]);

  const { saveProfilesToDatabase, getAllProfiles, loading } = useProfiles();
  const { toast } = useToast();

  const updateTestStatus = (testId: string, status: QATest['status'], result?: string) => {
    setTests(prev => prev.map(test =>
      test.id === testId
        ? { ...test, status, result }
        : test
    ));
  };

  const runTest = async (testId: string) => {
    updateTestStatus(testId, 'running');

    try {
      switch (testId) {
        case 'db-connection':
          await testDatabaseConnection();
          break;
        case 'profile-save':
          await testProfileSaving();
          break;
        case 'profile-load':
          await testProfileLoading();
          break;
        case 'smart-search':
          await testSmartSearch();
          break;
        case 'ui-responsive':
          await testUIResponsiveness();
          break;
        case 'data-parsing':
          await testDataParsing();
          break;
        default:
          throw new Error('Unknown test');
      }
      updateTestStatus(testId, 'passed', 'Test completed successfully');
    } catch (error: any) {
      updateTestStatus(testId, 'failed', error.message);
    }
  };

  const testDatabaseConnection = async () => {
    // Use the central supabase client and check for a basic response
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  };

  const testProfileSaving = async () => {
    const testProfile = {
      category: 'Test Category',
      city: 'Test City',
      confirmedProfiles: [{
        id: 'test-1',
        url: 'https://instagram.com/test',
        brandName: 'Test Brand',
        userId: 'testuser',
        followers: 1000,
        category: 'Test',
        city: 'Test',
        confidence: 'high' as const
      }],
      unconfirmedProfiles: []
    };

    const result = await saveProfilesToDatabase(testProfile);
    if (!result.sessionId) {
      throw new Error('Profile saving failed');
    }
  };

  const testProfileLoading = async () => {
    const profiles = await getAllProfiles({ category: 'Test' });
    // This is ok if it returns empty - just testing the function doesn't crash
  };

  const testSmartSearch = async () => {
    // Use the central supabase client to invoke the edge function
    const { error } = await supabase.functions.invoke('smart-search', {
        body: { query: 'test', limit: 5 },
    });

    if (error) {
        throw new Error(`Smart search API failed: ${error.message}`);
    }
  };

  const testUIResponsiveness = async () => {
    // This test checks for the presence of key UI elements.
    // Note: For true visual and responsiveness testing, consider tools like Storybook or Cypress.
    const elements = [
      'input[placeholder*="category"]',
      'input[placeholder*="city"]',
      'textarea[placeholder*="data"]',
      'button[type="button"]'
    ];

    for (const selector of elements) {
      if (!document.querySelector(selector)) {
        throw new Error(`UI element missing: ${selector}`);
      }
    }
  };

  const testDataParsing = async () => {
    // Test data parsing with sample data
    const testCases = [
      { input: '1.2M followers', expected: 1200000 },
      { input: '50K followers', expected: 50000 },
      { input: '999 followers', expected: 999 }
    ];

    for (const testCase of testCases) {
      const result = parseFollowerCount(testCase.input);
      if (result !== testCase.expected) {
        throw new Error(`Parsing failed: expected ${testCase.expected}, got ${result}`);
      }
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      if (test.status !== 'running') {
        await runTest(test.id);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const failedTests = tests.filter(t => t.status === 'failed');
    if (failedTests.length === 0) {
      toast({
        title: "All Tests Passed!",
        description: "The application is functioning correctly.",
      });
    } else {
      toast({
        title: "Some Tests Failed",
        description: `${failedTests.length} tests failed. Check results below.`,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: QATest['status']) => {
    switch (status) {
      case 'passed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: QATest['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-600">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-600">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          QA Testing Suite
        </CardTitle>
        <CardDescription>
          Comprehensive testing for all application features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runAllTests} disabled={loading}>
            Run All Tests
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    {getStatusBadge(test.status)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {test.name}
                  </TableCell>
                  <TableCell>
                    {test.description}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-sm text-muted-foreground">
                      {test.result || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runTest(test.id)}
                      disabled={test.status === 'running' || loading}
                    >
                      {test.status === 'running' ? 'Running...' : 'Run Test'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default QATestingSuite;
