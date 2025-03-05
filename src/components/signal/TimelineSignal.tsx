
import React from "react";

interface TimelineSignalProps {
  id: string;
  position: number;
  status: number;
  timestamp: string;
  reason: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function TimelineSignal({
  id,
  position,
  status,
  timestamp,
  reason,
  isSelected,
  onClick
}: TimelineSignalProps) {
  return (
    <div
      className={`absolute top-0 bottom-0 cursor-pointer transition-all
        ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: `${position}%`,
        width: isSelected ? '6px' : '4px',
        marginLeft: isSelected ? '-3px' : '-2px',
        backgroundColor: status === 1 ? '#22c55e' : '#ef4444',
        boxShadow: isSelected
          ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px rgba(0,0,0,0.1)'
          : '0 0 0 1px rgba(255,255,255,0.7)',
      }}
      onClick={onClick}
      title={`${status === 1 ? 'Running' : 'Stopped'} at ${timestamp}`}
    />
  );
}
