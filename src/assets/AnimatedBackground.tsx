import { useEffect, useState } from 'react';

interface FloatingShape {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  type: 'circle' | 'square' | 'triangle' | 'ring';
}

const AnimatedBackground = () => {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);

  useEffect(() => {
    const generateShapes = (): FloatingShape[] => {
      const types: FloatingShape['type'][] = ['circle', 'square', 'triangle', 'ring'];
      return Array.from({ length: 15 }, (_, i) => ({
        id: i,
        size: Math.random() * 60 + 20,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 10 + 15,
        delay: Math.random() * 5,
        type: types[Math.floor(Math.random() * types.length)],
      }));
    };
    setShapes(generateShapes());
  }, []);

  const renderShape = (shape: FloatingShape) => {
    const baseClasses = "absolute opacity-20";
    
    switch (shape.type) {
      case 'circle':
        return (
          <div
            key={shape.id}
            className={`${baseClasses} rounded-full bg-login-shape animate-float`}
            style={{
              width: shape.size,
              height: shape.size,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              animationDuration: `${shape.duration}s`,
              animationDelay: `${shape.delay}s`,
            }}
          />
        );
      case 'square':
        return (
          <div
            key={shape.id}
            className={`${baseClasses} rounded-lg bg-login-shape animate-float-rotate`}
            style={{
              width: shape.size,
              height: shape.size,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              animationDuration: `${shape.duration}s`,
              animationDelay: `${shape.delay}s`,
            }}
          />
        );
      case 'triangle':
        return (
          <div
            key={shape.id}
            className={`${baseClasses} animate-float-slow`}
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: 0,
              height: 0,
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size}px solid hsl(var(--login-shape))`,
              animationDuration: `${shape.duration}s`,
              animationDelay: `${shape.delay}s`,
            }}
          />
        );
      case 'ring':
        return (
          <div
            key={shape.id}
            className={`${baseClasses} rounded-full border-4 border-login-shape animate-pulse-slow`}
            style={{
              width: shape.size,
              height: shape.size,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              animationDuration: `${shape.duration}s`,
              animationDelay: `${shape.delay}s`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-login-orb rounded-full blur-3xl opacity-60 animate-pulse-slow" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-login-orb-secondary rounded-full blur-3xl opacity-50 animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-login-orb-tertiary rounded-full blur-2xl opacity-40 animate-float" />
      
      {/* Floating shapes */}
      {shapes.map(renderShape)}
      
      {/* Decorative lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-login-grid" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Animated orbit rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-[300px] h-[300px] border border-login-orbit rounded-full animate-spin-slow opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-login-orbit rounded-full animate-spin-reverse opacity-15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-login-orbit rounded-full animate-spin-slow opacity-10" style={{ animationDuration: '30s' }} />
      </div>
      
      {/* Glowing dots on orbits */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] animate-spin-slow">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-login-dot rounded-full shadow-lg shadow-login-dot" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] animate-spin-reverse">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-login-dot-secondary rounded-full shadow-lg shadow-login-dot-secondary" />
      </div>
    </div>
  );
};

export default AnimatedBackground;
