
import React from "react";

interface TimeIndicatorProps {
  position: number;
  panOffset: number;
  zoomLevel: number;
}

export function TimeIndicator({ position, panOffset, zoomLevel }: TimeIndicatorProps) {
  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20"
      style={{
        left: `${position * 100}%`,
        transform: `translateX(-${panOffset * (1/zoomLevel)}px)`,
      }}
    >
      <div
        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
    </div>
  );
}
