
import { useMemo } from "react";
import { calculateNormalizedPosition } from "@/utils/timelineUtils";

interface SignalLog {
  id: string;
  machineId: string;
  status: "0" | "1";
  timestamp: string;
  endTimestamp?: string;
  duration?: string;
  reason: string;
}

export function useTimelineData(
  signalLogs: SignalLog[], 
  machineId: string,
  startTime: string = "08:00",
  endTime: string = "17:00"
) {
  const timelineData = useMemo(() => {
    // Filter logs for the selected machine
    const filteredLogs = signalLogs.filter(log => log.machineId === machineId);
    
    if (!filteredLogs.length) return [];
    
    // Create enhanced timeline data with position and width calculations
    const enhancedData = filteredLogs.map((log, index, array) => {
      // Calculate position based on timestamp
      const position = calculateNormalizedPosition(log.timestamp, startTime, endTime) * 100;
      
      // Calculate width if we have duration information
      let width = 0.5; // Default narrow width
      
      if (log.endTimestamp) {
        const endPosition = calculateNormalizedPosition(log.endTimestamp, startTime, endTime) * 100;
        width = Math.max(0.5, endPosition - position);
      } else if (index < array.length - 1 && array[index + 1].status !== log.status) {
        // If this log doesn't have an endTimestamp but there's a next log with different status,
        // use the next log's timestamp as this log's end
        const nextLogPos = calculateNormalizedPosition(array[index + 1].timestamp, startTime, endTime) * 100;
        width = Math.max(0.5, nextLogPos - position);
      } else if (log.status === "1") {
        // For running logs without end time, extend to the current time or to the end of the timeline
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}:${seconds}`;
        
        const currentPosition = calculateNormalizedPosition(currentTime, startTime, endTime) * 100;
        
        // Only extend if current time is after the log time
        if (currentPosition > position) {
          width = Math.max(0.5, currentPosition - position);
        }
      }
      
      return {
        id: log.id,
        status: Number(log.status),
        position,
        width,
        timestamp: log.timestamp,
        endTimestamp: log.endTimestamp,
        duration: log.duration,
        reason: log.reason
      };
    });
    
    // Sort by timestamp
    return enhancedData.sort((a, b) => a.position - b.position);
  }, [signalLogs, machineId, startTime, endTime]);

  return timelineData;
}
