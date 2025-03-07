
import React from "react";

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
  onClick
}: TimelineSignalProps) {
  const tooltipContent = duration 
    ? `${status === 1 ? 'Running' : 'Stopped'} from ${timestamp}${endTimestamp ? ` to ${endTimestamp}` : ''} (${duration})`
    : `${status === 1 ? 'Running' : 'Stopped'} at ${timestamp}`;

  return (
    <div
      className={`absolute top-0 bottom-0 cursor-pointer transition-all
        ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: `${position}%`,
        width: `${width}%`,  // Use provided width as percentage
        backgroundColor: status === 1 ? '#22c55e' : '#ef4444',
        boxShadow: isSelected
          ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px rgba(0,0,0,0.1)'
          : '0 0 0 1px rgba(255,255,255,0.7)',
      }}
      onClick={onClick}
      title={tooltipContent}
    />
  );
}
