import React from 'react';
import { Flame } from 'lucide-react';

interface AnimatedFlameProps {
  className?: string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

/**
 * Animated flame icon that looks like real fire.
 * Uses layered SVG flames with staggered CSS animations
 * for a dynamic, living fire effect.
 */
const AnimatedFlame: React.FC<AnimatedFlameProps> = ({
  className = '',
  active = true,
  size = 'md',
  'data-testid': testId,
}) => {
  const sizeMap = {
    sm: { container: 'w-4 h-4', icon: 'w-4 h-4' },
    md: { container: 'w-5 h-5', icon: 'w-5 h-5' },
    lg: { container: 'w-6 h-6', icon: 'w-6 h-6' },
  };

  const s = sizeMap[size];

  if (!active) {
    return (
      <Flame
        className={`${s.icon} text-muted-foreground/40 ${className}`}
        data-testid={testId}
      />
    );
  }

  return (
    <span
      className={`animated-flame-container ${s.container} ${className}`}
      data-testid={testId}
      aria-label="Hot Lead"
    >
      {/* Outer glow layer */}
      <span className="animated-flame-glow" />

      {/* Base flame (largest, slowest) */}
      <Flame className={`animated-flame-base ${s.icon}`} />

      {/* Middle flame (medium, offset timing) */}
      <Flame className={`animated-flame-mid ${s.icon}`} />

      {/* Top flame (smallest, fastest flicker) */}
      <Flame className={`animated-flame-top ${s.icon}`} />
    </span>
  );
};

export default AnimatedFlame;
