import React from 'react';
import { useReducedMotion } from 'framer-motion';

interface GradientTextSweepProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  speed?: number; // seconds
}

export const GradientTextSweep: React.FC<GradientTextSweepProps> = ({
  children,
  className = '',
  gradient = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 25%, #fef08a 50%, #fbbf24 75%, #f59e0b 100%)',
  speed = 4,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span
      className={`inline-block bg-clip-text text-transparent font-black tracking-tight ${className}`}
      style={{
        backgroundImage: gradient,
        backgroundSize: '250% 100%',
        animation: shouldReduceMotion ? 'none' : `gradientTextSweepAnim ${speed}s linear infinite`,
        WebkitBackgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
};
