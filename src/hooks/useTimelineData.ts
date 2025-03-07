
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
    const enhancedData = filteredLogs.map((log, index) => {
      // Calculate position based on timestamp
      const position = calculateNormalizedPosition(log.timestamp, startTime, endTime) * 100;
      
      // Calculate width if we have duration information
      let width = 0.5; // Default narrow width
      
      if (log.endTimestamp) {
        const endPosition = calculateNormalizedPosition(log.endTimestamp, startTime, endTime) * 100;
        width = Math.max(0.5, endPosition - position);
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
