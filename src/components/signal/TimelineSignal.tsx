
import React, { useEffect, useState } from "react";

interface TimelineSignalProps {
  id: string;
  position: number;
  width: number;  // Added width property to control bar length
  status: number;
  timestamp: string;
  endTimestamp?: string;  // Optional end timestamp
  duration?: string;  // Optional duration display
  reason: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  isActiveSignal?: boolean; // New prop to indicate if this is the currently growing signal
}

export function TimelineSignal({
  id,
  position,
  width,
  status,
  timestamp,
  endTimestamp,
  duration,
  reason,
  isSelected,
  onClick,
  isActiveSignal = false
}: TimelineSignalProps) {
  const [currentWidth, setCurrentWidth] = useState(isActiveSignal && status === 1 ? 0.5 : width);
  
  // Effect to animate width for active signals
  useEffect(() => {
    // If this is an active signal and it's a "running" signal (status 1), start with minimal width
    if (isActiveSignal && status === 1) {
      // Start with minimal width
      setCurrentWidth(0.5);
      
      // Set up interval to gradually increase width to match target width
      const growInterval = setInterval(() => {
        setCurrentWidth(prev => {
          if (prev >= width) {
            clearInterval(growInterval);
            return width;
          }
          return prev + 0.05; // Grow gradually
        });
      }, 200); // Update more frequently for smoother animation
      
      return () => clearInterval(growInterval);
    } else {
      // For non-active signals or status 0, just set to target width
      setCurrentWidth(width);
    }
  }, [width, isActiveSignal, status]);

  const tooltipContent = duration 
    ? `${status === 1 ? 'Running' : 'Stopped'} from ${timestamp}${endTimestamp ? ` to ${endTimestamp}` : ''} (${duration})`
    : `${status === 1 ? 'Running' : 'Stopped'} at ${timestamp}`;

  return (
    <div
      className={`absolute top-0 bottom-0 cursor-pointer
        ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: `${position}%`,
        width: `${currentWidth}%`,  // Use animated width
        backgroundColor: status === 1 ? '#22c55e' : '#ef4444',
        boxShadow: isSelected
          ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px rgba(0,0,0,0.1)'
          : '0 0 0 1px rgba(255,255,255,0.7)',
        transition: isActiveSignal && status === 1 ? 'none' : 'all 0.2s ease',
      }}
      onClick={onClick}
      title={tooltipContent}
    >
      {currentWidth > 5 && (
        <div className="absolute inset-0 px-2 text-xs text-white flex items-center overflow-hidden whitespace-nowrap">
          {duration && currentWidth > 10 ? duration : ''}
        </div>
      )}
    </div>
  );
}
