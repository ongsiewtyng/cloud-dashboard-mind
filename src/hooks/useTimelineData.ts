
import { useMemo } from "react";
import { type SignalLog } from '@/lib/signal-service';
import { calculateNormalizedPosition } from "@/utils/timelineUtils";

export function useTimelineData(signalLogs: SignalLog[], machineId: string) {
  return useMemo(() => {
    if (!signalLogs?.length) {
      console.log('No signal logs available for timeline');
      return [];
    }

    // Debug the incoming data
    console.log('Processing logs for timeline:', signalLogs.map(log => ({
      status: log.status,
      timestamp: log.timestamp,
      endTimestamp: log.endTimestamp
    })));

    // Sort logs by timestamp in descending order (newest first)
    const sortedLogs = [...signalLogs].sort((a, b) => 
      new Date(`${a.date}T${a.timestamp}`).getTime() - new Date(`${b.date}T${b.timestamp}`).getTime()
    );

    // Get current time for calculating active signal width
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentPosition = calculateNormalizedPosition(currentTime, "08:00", "17:00") * 100;

    // Create timeline points for all logs
    const timelinePoints = sortedLogs.map((log, index) => {
      // Calculate position based on timestamp
      const position = calculateNormalizedPosition(log.timestamp, "08:00", "17:00") * 100;

      // Calculate width based on duration or next log
      let width = 0;
      let isActiveSignal = false;
      let extendToEnd = false;

      if (log.endTimestamp) {
        const endPosition = calculateNormalizedPosition(log.endTimestamp, "08:00", "17:00") * 100;
        width = Math.max(0.5, endPosition - position);
      } else if (index < sortedLogs.length - 1) {
        // If no endTimestamp, use next log's timestamp
        const nextPosition = calculateNormalizedPosition(sortedLogs[index + 1].timestamp, "08:00", "17:00") * 100;
        width = Math.max(0.5, nextPosition - position);
      } else {
        // For the last log, extend to current time
        width = Math.max(0.5, currentPosition - position);
        isActiveSignal = true;
        extendToEnd = true;
      }

      // Ensure status is treated as a number
      const numericStatus = typeof log.status === 'string' ? parseInt(log.status) : log.status;

      const point = {
        id: log.id,
        status: numericStatus,
        position,
        width,
        timestamp: log.timestamp,
        endTimestamp: log.endTimestamp || "",
        duration: log.duration || "0m",
        reason: log.reason,
        isActiveSignal,
        extendToEnd
      };

      // Debug each point
      console.log('Created timeline point:', point);

      return point;
    });

    // Add a continuous status bar from the last log to current time
    if (timelinePoints.length > 0) {
      const lastLog = timelinePoints[timelinePoints.length - 1];
      const lastPosition = lastLog.position + lastLog.width;
      
      // Only add continuous bar if there's a gap between last log and current time
      if (lastPosition < currentPosition) {
        timelinePoints.push({
          id: 'continuous-status',
          status: lastLog.status,
          position: lastPosition,
          width: currentPosition - lastPosition,
          timestamp: lastLog.timestamp,
          endTimestamp: "",
          duration: "0m",
          reason: '',
          isActiveSignal: true,
          extendToEnd: true
        });
      }
    }

    // Debug final timeline data
    console.log('Final timeline points:', timelinePoints);

    return timelinePoints;
  }, [signalLogs, machineId]);
}
