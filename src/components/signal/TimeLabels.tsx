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
                className="absolute h-full flex flex-col items-center justify-end"
                style={{
                  left: `${label.position * zoomLevel}%`,
                  transform: `translateX(-${panOffset}px)`,
                }}
            >
          <span className="text-xs text-slate-500 whitespace-nowrap transform -translate-x-1/2 -translate-y-6 absolute">
            {label.label}
          </span>
              <div className="h-4 border-l border-slate-300 w-0"></div>
            </div>
        ))}
      </div>
  );
}
