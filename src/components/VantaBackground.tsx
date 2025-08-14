import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import BIRDS from 'vanta/dist/vanta.dots.min';

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface VantaBackgroundProps {
  className?: string;
}

const VantaBackground = ({ className }: VantaBackgroundProps) => {
  const vantaRef = useRef(null);
  const vantaEffect = useRef<any>(null);
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Destroy any existing Vanta effect before creating a new one
    if (vantaEffect.current) {
      vantaEffect.current.destroy();
    }

    // Set colors based on the current theme
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

    vantaEffect.current = BIRDS({
      el: vantaRef.current,
      THREE: THREE, // This is the corrected line. It explicitly tells Vanta.js to use the imported THREE.
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      ...themeColors,
    });

    // Cleanup function to destroy the Vanta effect when the component unmounts
    return () => {
      if (vantaEffect.current) {
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
