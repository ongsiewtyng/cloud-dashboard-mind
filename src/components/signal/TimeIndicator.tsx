
import React from "react";

interface TimeIndicatorProps {
  position: number;
  panOffset: number;
  zoomLevel: number;
}

export function TimeIndicator({ position, panOffset, zoomLevel }: TimeIndicatorProps) {
  // Position is a normalized value (0-1) representing time of day
  const positionPercentage = position * 100;
  
  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20"
      style={{
          left: `${positionPercentage}%`,
          transform: `translateX(-${panOffset / zoomLevel}px)`,
      }}
    >
      <div
        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
    </div>
  );
}
