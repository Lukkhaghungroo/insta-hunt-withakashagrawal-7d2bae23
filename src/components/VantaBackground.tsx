import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const VantaBackground = ({ className }: { className?: string }) => {
  const vantaRef = useRef(null);
  const vantaEffect = useRef<any>(null);
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    let isVantaInitialized = false;

    // Use dynamic imports to handle the external libraries
    import('three').then(THREE => {
      // Expose THREE globally, as Vanta.js expects it
      // @ts-ignore
      window.THREE = THREE;

      // Import the Vanta.js effect
      import('vanta/dist/vanta.dots.min').then(VANTA => {
        if (vantaRef.current) {
          // Destroy any existing Vanta effect before creating a new one
          if (vantaEffect.current) {
            vantaEffect.current.destroy();
          }

          const themeColors = isDark
            ? {
                color1: '#7e22ce',
                color2: '#4a044e',
                backgroundColor: '#0f0a1a',
              }
            : {
                color1: '#c084fc',
                color2: '#9333ea',
                backgroundColor: '#f8fafc',
              };

          vantaEffect.current = VANTA.default({
            el: vantaRef.current,
            THREE: THREE, // Explicitly pass THREE to the Vanta effect
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            ...themeColors,
          });
          isVantaInitialized = true;
        }
      }).catch(error => console.error('Failed to load Vanta.js:', error));
    }).catch(error => console.error('Failed to load Three.js:', error));

    return () => {
      if (isVantaInitialized && vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, [isDark, mounted]);

  return (
    <div
      ref={vantaRef}
      className={cn("fixed inset-0 w-full h-full -z-10", className)}
    />
  );
};

export default VantaBackground;
