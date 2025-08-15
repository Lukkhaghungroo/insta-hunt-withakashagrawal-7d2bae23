import { Suspense, lazy } from 'react';
import Index from './Index';

// Lazy load VantaBackground only when needed
const VantaBackground = lazy(() => import('@/components/VantaBackground'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
  </div>
);

const IndexWithVanta = () => {
  return (
    <div className="relative min-h-screen">
      <Suspense fallback={null}>
        <VantaBackground />
      </Suspense>
      <Index />
    </div>
  );
};

export default IndexWithVanta;