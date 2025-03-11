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
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
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
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  isActiveSignal = false,
  extendToEnd = false
}: TimelineSignalProps) {
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentDuration, setCurrentDuration] = useState(duration);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>();
  
  // Effect to animate width and update duration for active signals
  useEffect(() => {
    if (isActiveSignal) {
      const updateSignal = () => {
        const now = new Date();
        const [startHours, startMinutes] = timestamp.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(startHours, startMinutes, 0);
        
        // Calculate duration in minutes
        const diffMs = now.getTime() - startDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        // Update duration display
        const newDuration = hours > 0 
          ? `${hours}h ${mins}m`
          : `${mins}m`;
        setCurrentDuration(newDuration);

        // Schedule next update
        const nextMinute = new Date(now);
        nextMinute.setMinutes(now.getMinutes() + 1, 0, 0);
        const delay = nextMinute.getTime() - now.getTime();
        
        setTimeout(updateSignal, delay);
      };

      // Start updating
      updateSignal();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setCurrentDuration(duration);
    }
  }, [isActiveSignal, timestamp, duration]);

  // Effect to handle width updates
  useEffect(() => {
    if (isActiveSignal && extendToEnd) {
      const updateWidth = (timestamp: number) => {
        if (!lastUpdateRef.current) {
          lastUpdateRef.current = timestamp;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const [hours, minutes, seconds] = currentTime.split(':').map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
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

      animationFrameRef.current = requestAnimationFrame(updateWidth);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setCurrentWidth(width);
    }
  }, [isActiveSignal, extendToEnd, position, width]);

  const tooltipContent = duration 
    ? `${status === 1 ? 'Running' : 'Stopped'} from ${timestamp}${endTimestamp ? ` to ${endTimestamp}` : ''} (${duration})`
    : `${status === 1 ? 'Running' : 'Stopped'} at ${timestamp}`;

  return (
    <div
      className={`absolute h-12 cursor-pointer transition-all timeline-signal
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
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      title={`${status === 1 ? 'Running' : 'Down'} - ${currentDuration || duration || '0m'}`}
    >
      {/* Add continuous status bar */}
      {extendToEnd && (
        <div 
          className={`absolute h-12 ${status === 1 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
          style={{
            left: '100%',
            width: '100vw', // Extend to the end of the viewport
            bottom: '0',
          }}
        />
      )}
      {currentWidth > 5 && (
        <div className="absolute inset-0 px-2 text-xs text-white flex items-center overflow-hidden whitespace-nowrap">
          {currentDuration || duration || ''}
        </div>
      )}
    </div>
  );
}
