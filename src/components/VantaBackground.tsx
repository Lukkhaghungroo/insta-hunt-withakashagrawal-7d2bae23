import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import BIRDS from 'vanta/dist/vanta.dots.min';

// We no longer need to import useTheme
// import { useTheme } from '@/contexts/ThemeContext';
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

    // We will hardcode the dark theme colors here
    const darkThemeColors = {
      color1: '#7e22ce',
      color2: '#4a044e',
      backgroundColor: '#0f0a1a',
    };

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

          vantaEffect.current = VANTA.default({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            ...darkThemeColors, // Always use the dark theme colors
          });
        }
      }).catch(error => console.error('Failed to load Vanta.js:', error));
    }).catch(error => console.error('Failed to load Three.js:', error));

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, [mounted]); // Remove isDark from the dependency array

  return (
    <div
      ref={vantaRef}
      className={cn("fixed inset-0 w-full h-full -z-10", className)}
    />
  );
};

export default VantaBackground;
