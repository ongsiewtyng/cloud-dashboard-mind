
import React from "react";

interface TimeLabelsProps {
  hourlyLabels: Array<{ hour: number; position: number; label: string }>;
  panOffset: number;
  zoomLevel: number;
}

export function TimeLabels({ hourlyLabels, panOffset, zoomLevel }: TimeLabelsProps) {
  return (
    <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none">
      {hourlyLabels.map((label, i) => (
        <div
          key={`hour-${label.hour}`}
          className="absolute top-0 h-full flex flex-col items-center justify-start"
          style={{
            left: `${label.position * zoomLevel}%`,
            transform: `translateX(-${panOffset}px)`,
          }}
        >
          <div className="h-6 border-l border-slate-300 w-0"></div>
          <span
            className="text-xs text-slate-500 whitespace-nowrap transform -translate-x-1/2 mt-1 absolute top-8">
            {label.label}
          </span>
        </div>
      ))}
    </div>
  );
}
