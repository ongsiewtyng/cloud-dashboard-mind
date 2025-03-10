import React, { useEffect, useState, useRef } from "react";

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
  extendToEnd?: boolean; // New prop to indicate if this signal should extend to the end
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
  isActiveSignal = false,
  extendToEnd = false
}: TimelineSignalProps) {
  const [currentWidth, setCurrentWidth] = useState(width);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>();
  
  // Effect to animate width for active signals
  useEffect(() => {
    if (isActiveSignal) {
      // Function to update width based on current time
      const updateWidth = (timestamp: number) => {
        if (!lastUpdateRef.current) {
          lastUpdateRef.current = timestamp;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const [hours, minutes, seconds] = currentTime.split(':').map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // Calculate normalized position (0-100) based on time
        const startTime = "08:00";
        const endTime = "17:00";
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        const startSeconds = startHours * 3600 + startMinutes * 60;
        const endSeconds = endHours * 3600 + endMinutes * 60;
        
        const progress = (totalSeconds - startSeconds) / (endSeconds - startSeconds);
        const newWidth = Math.max(0.5, (progress * 100) - position);
        
        setCurrentWidth(newWidth);
        animationFrameRef.current = requestAnimationFrame(updateWidth);
      };

      // Start the animation
      animationFrameRef.current = requestAnimationFrame(updateWidth);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setCurrentWidth(width);
    }
  }, [isActiveSignal, status, position, width]);

  const tooltipContent = duration 
    ? `${status === 1 ? 'Running' : 'Stopped'} from ${timestamp}${endTimestamp ? ` to ${endTimestamp}` : ''} (${duration})`
    : `${status === 1 ? 'Running' : 'Stopped'} at ${timestamp}`;

  return (
    <div
      className={`absolute h-12 cursor-pointer transition-all
        ${isSelected ? 'z-10 scale-105' : 'z-0'}
        ${status === 1 
          ? `bg-green-500 ${isSelected ? 'ring-2 ring-green-300' : ''}` 
          : `bg-red-500 ${isSelected ? 'ring-2 ring-red-300' : ''}`
        }`}
      style={{
        left: `${position}%`,
        width: `${Math.max(currentWidth, 0.5)}%`,
        minWidth: '2px',
        bottom: '4px',
        transition: isSelected ? 'transform 0.2s ease-out' : undefined,
      }}
      onClick={onClick}
      title={tooltipContent}
    >
      {/* Add continuous status bar */}
      {isActiveSignal && (
        <div 
          className={`absolute h-12 ${status === 1 ? 'bg-green-500' : 'bg-red-500'}`}
          style={{
            left: '100%',
            width: '100vw', // Extend to the end of the viewport
            bottom: '0',
          }}
        />
      )}
      {currentWidth > 5 && (
        <div className="absolute inset-0 px-2 text-xs text-white flex items-center overflow-hidden whitespace-nowrap">
          {duration && currentWidth > 10 ? duration : ''}
        </div>
      )}
    </div>
  );
}
