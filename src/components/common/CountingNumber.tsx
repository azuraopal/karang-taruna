import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface CountingNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountingNumber: React.FC<CountingNumberProps> = ({
  value,
  duration = 1.4,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const renderedValue = shouldReduceMotion && isInView ? value : displayValue;

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;

    let startTime: number | null = null;
    let animId: number;

    const animateCount = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(1, elapsed / duration);

      // Power3 out ease curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeProgress * value);

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animateCount);
      } else {
        setDisplayValue(value);
        setIsCompleted(true);
      }
    };

    animId = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(animId);
  }, [isInView, value, duration, shouldReduceMotion]);

  return (
    <motion.span
      ref={ref}
      animate={isCompleted && !shouldReduceMotion ? { scale: [1, 1.14, 1] } : {}}
      transition={{ duration: 0.35, ease: 'backOut' }}
      className={`tabular-nums inline-block font-bold ${className}`}
    >
      {prefix}
      {renderedValue}
      {suffix}
    </motion.span>
  );
};
