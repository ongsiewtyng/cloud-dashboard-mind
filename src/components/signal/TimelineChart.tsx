
import { useState, useEffect } from "react";

interface TimelineChartProps {
  timelineData: Array<{
    id: string;
    status: number;
    position: number;
    timestamp: string;
    reason: string;
  }>;
}

export function TimelineChart({ timelineData }: TimelineChartProps) {
  const startTime = "08:00";
  const endTime = "17:00";
  
  return (
    <div className="mb-6 bg-slate-100 p-4 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Machine Status Timeline</h3>
      <div className="relative h-16 w-full bg-white border border-slate-200 rounded">
        {/* Time labels */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-slate-600 px-2">
          <span>{startTime}</span>
          <span>{endTime}</span>
        </div>
        
        {/* Chart background */}
        <div className="absolute top-5 left-0 right-0 bottom-0">
          {/* Signal bars */}
          {timelineData.map((data) => (
            <div 
              key={data.id}
              className="absolute top-0 bottom-0" 
              style={{ 
                left: `${data.position}%`,
                width: '4px',
                marginLeft: '-2px', // Center the bar
                backgroundColor: data.status === 1 ? '#22c55e' : '#ef4444',
                border: '1px solid #ffffff',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
              }}
              title={`${data.timestamp} - ${data.status ? 'Running' : 'Stopped'}${data.reason ? ` (${data.reason})` : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
