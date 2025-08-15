import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';

interface VantaBackgroundProps {
  className?: string;
}

const VantaBackground = ({ className }: VantaBackgroundProps) => {
  const vantaRef = useRef(null);
  const vantaEffect = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Delay loading to improve initial page load
    const timer = setTimeout(() => {
      const darkThemeColors = {
        color1: '#7e22ce',
        color2: '#4a044e',
        backgroundColor: '#0f0a1a',
      };

      // Use dynamic imports with proper error handling and optimization
      Promise.all([
        import('three'),
        import('vanta/dist/vanta.dots.min')
      ]).then(([THREE, VANTA]) => {
        if (vantaRef.current) {
          // Destroy any existing Vanta effect
          if (vantaEffect.current) {
            vantaEffect.current.destroy();
          }

          // @ts-ignore - Expose THREE globally for Vanta
          window.THREE = THREE;

          vantaEffect.current = VANTA.default({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 0.8, // Reduced for better performance
            scaleMobile: 0.5, // Much smaller on mobile
            ...darkThemeColors,
          });
        }
      }).catch(error => {
        console.warn('Vanta effect failed to load, using fallback:', error);
      });
    }, 100); // Small delay to not block initial render

    return () => {
      clearTimeout(timer);
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, [mounted]);

  return (
    <div
      ref={vantaRef}
      className={cn("fixed inset-0 w-full h-full -z-10", className)}
    />
  );
};

export default VantaBackground;
