
import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#10b981'; // Verde (green-500)
  if (percentage >= 70) return '#84cc16'; // Verde lima (lime-500)
  if (percentage >= 50) return '#eab308'; // Amarillo (yellow-500)
  if (percentage >= 30) return '#f97316'; // Naranja (orange-500)
  return '#ef4444'; // Rojo (red-500)
};

const ProgressRing = ({ percentage, size = 60, strokeWidth = 4 }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor(percentage)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-gray-700">
        {percentage}%
      </span>
    </div>
  );
};

export default ProgressRing;
