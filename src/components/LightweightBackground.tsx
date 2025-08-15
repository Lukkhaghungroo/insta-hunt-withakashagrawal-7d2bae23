import { cn } from '@/lib/utils';

interface LightweightBackgroundProps {
  className?: string;
}

const LightweightBackground = ({ className }: LightweightBackgroundProps) => {
  return (
    <div className={cn("fixed inset-0 w-full h-full -z-10", className)}>
      {/* Lightweight CSS-only background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-blue-50/10 to-pink-50/20 dark:from-purple-900/10 dark:via-blue-900/5 dark:to-pink-900/10" />
      
      {/* Animated particles using CSS only */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Static dots pattern - much lighter than Vanta */}
        <div 
          className="absolute inset-0 opacity-20 dark:opacity-10"
          style={{
            backgroundImage: `radial-gradient(2px 2px at 20px 30px, rgba(139, 69, 255, 0.3), transparent),
                              radial-gradient(2px 2px at 40px 70px, rgba(168, 85, 247, 0.2), transparent),
                              radial-gradient(1px 1px at 90px 40px, rgba(124, 58, 237, 0.4), transparent)`,
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 120px',
          }}
        />
        
        {/* Subtle floating animation */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/20 rounded-full animate-pulse" 
             style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-pink-400/30 rounded-full animate-pulse" 
             style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-blue-400/20 rounded-full animate-pulse" 
             style={{ animationDelay: '2s', animationDuration: '5s' }} />
      </div>
    </div>
  );
};

export default LightweightBackground;