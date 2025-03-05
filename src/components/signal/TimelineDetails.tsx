
import React from "react";

interface TimelineDetailsProps {
  selectedSignal: {
    id: string;
    status: number;
    timestamp: string;
    reason: string;
  } | null;
}

export function TimelineDetails({ selectedSignal }: TimelineDetailsProps) {
  if (!selectedSignal) return null;
  
  return (
    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Signal Details</h4>
        <div
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor: selectedSignal.status === 1 ? '#22c55e' : '#ef4444'
          }}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-slate-500">Status:</span>{" "}
          <span className="font-medium">
            {selectedSignal.status === 1 ? "Running" : "Stopped"}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Time:</span>{" "}
          <span className="font-medium">{selectedSignal.timestamp}</span>
        </div>
        {selectedSignal.reason && (
          <div className="col-span-2">
            <span className="text-slate-500">Reason:</span>{" "}
            <span className="font-medium capitalize">{selectedSignal.reason}</span>
          </div>
        )}
      </div>
    </div>
  );
}
