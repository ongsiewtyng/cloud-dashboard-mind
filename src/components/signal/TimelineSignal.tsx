
import React, { useEffect, useState } from "react";
import { formatDistance } from "date-fns";

interface TimelineSignalProps {
  id: string;
  position: number;
  width: number;
  status: number;
  timestamp: string;
  endTimestamp?: string;
  duration?: string;
  reason: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  isActiveSignal?: boolean;
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
  const [displayDuration, setDisplayDuration] = useState(duration || '');
  
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
  
  // Auto-update duration for active running signals
  useEffect(() => {
    if (isActiveSignal && status === 1 && !endTimestamp) {
      // Parse the timestamp
      const startTime = parseTimeString(timestamp);
      
      // Set up interval to update duration every minute
      const updateInterval = setInterval(() => {
        const now = new Date();
        // If now is before startTime, assume it's the same day but later time
        if (now.getTime() < startTime.getTime()) {
          startTime.setDate(startTime.getDate() - 1);
        }
        
        // Calculate duration between start time and now
        const durationFormatted = formatDistance(startTime, now, { includeSeconds: false });
        setDisplayDuration(durationFormatted);
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(updateInterval);
    } else {
      // For completed signals, use the provided duration
      setDisplayDuration(duration || '');
    }
  }, [isActiveSignal, status, timestamp, endTimestamp, duration]);
  
  // Helper to parse HH:MM:SS into a Date object
  const parseTimeString = (timeStr: string): Date => {
    const now = new Date();
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    
    // Create date object with today's date but using the time from the string
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      seconds || 0
    );
    
    return date;
  };

  const tooltipContent = displayDuration 
    ? `${status === 1 ? 'Running' : 'Stopped'} from ${timestamp}${endTimestamp ? ` to ${endTimestamp}` : ''} (${displayDuration})`
    : `${status === 1 ? 'Running' : 'Stopped'} at ${timestamp}`;

  return (
    <div
      className={`absolute top-6 bottom-0 cursor-pointer
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
          {displayDuration && currentWidth > 10 ? displayDuration : ''}
        </div>
      )}
    </div>
  );
}
