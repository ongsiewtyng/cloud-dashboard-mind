
import { useState, useEffect } from "react";
import { getTimeDifference, getCurrentTimeString, getRandomDowntimeReason } from "@/utils/signalUtils";
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

export function useSignalSimulation(selectedMachine: string | null) {
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([]);
  const [newLogReason, setNewLogReason] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastStatus, setLastStatus] = useState<"0" | "1">("1");
  const [lastLogTime, setLastLogTime] = useState<Date | null>(null);
  
  // Timeline boundaries (8 AM to 5 PM)
  const startTime = "08:00";
  const endTime = "17:00";

  // Automatically start simulation when a machine is selected
  useEffect(() => {
    if (selectedMachine) {
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
    }
  }, [selectedMachine]);

  // Check if current time is within the timeline boundaries
  const isWithinTimelineBounds = () => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const currentTimeMinutes = currentHours * 60 + currentMinutes;
    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;
    
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  };

  const addSignalLog = (machineId: string, status: "0" | "1", autoReason?: string) => {
    let reason = status === "1" ? "" : newLogReason;

    if (autoReason && status === "0") {
      reason = autoReason;
    }

    // Format timestamp in HH:MM:SS format
    const timestamp = getCurrentTimeString();

    // Find the previous log (if any) to calculate duration
    const previousLogs = signalLogs.filter(log => log.machineId === machineId);
    const previousLog = previousLogs.length > 0 ? previousLogs[0] : null;
    
    let endTimestamp: string | undefined;
    let duration: string | undefined;
    
    // If there was a previous log, update it with end time and duration
    if (previousLog && previousLog.status !== status) {
      endTimestamp = timestamp;
      duration = getTimeDifference(previousLog.timestamp, timestamp);
      
      // Update the previous log with end time and duration
      setSignalLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === previousLog.id 
            ? { ...log, endTimestamp, duration } 
            : log
        )
      );
    }

    const newLog = {
      id: Date.now().toString(),
      machineId,
      status,
      timestamp,
      reason,
    };

    // Check for duplication or conflicting logs at the same timestamp
    if (signalLogs.length > 0) {
      const lastLog = signalLogs[0];

      const lastLogTime = new Date(`1970-01-01T${lastLog.timestamp}Z`).getTime();
      const newLogTime = new Date(`1970-01-01T${newLog.timestamp}Z`).getTime();

      if (
          lastLog.machineId === newLog.machineId &&
          Math.abs(newLogTime - lastLogTime) < 1000 // Within 1 sec
      ) {
        if (
            lastLog.status === newLog.status &&
            lastLog.reason === newLog.reason
        ) {
          console.log("Duplicate log detected, not adding to signalLogs");
          return;
        }

        if (lastLog.status !== newLog.status) {
          console.log("Conflicting log detected at same timestamp, not adding");
          return;
        }
      }
    }

    setSignalLogs(prevLogs => [newLog, ...prevLogs]);
    setNewLogReason("");
    setLastStatus(status);
    setLastLogTime(new Date());

    return true;
  };

  // Real-time simulation effect based on actual time
  useEffect(() => {
    let simulationInterval: number | null = null;
    
    if (isSimulating && selectedMachine) {
      console.log("Starting real-time simulation for machine:", selectedMachine);
      
      // Initial status check based on time of day
      const checkInitialStatus = () => {
        // Only start if within timeline bounds
        if (isWithinTimelineBounds()) {
          // 90% chance to start running for better UX
          const initialStatus = Math.random() > 0.1 ? "1" : "0";
          
          if (initialStatus === "0") {
            addSignalLog(selectedMachine, initialStatus, getRandomDowntimeReason());
          } else {
            addSignalLog(selectedMachine, initialStatus);
          }
        }
      };
      
      // Initial check
      checkInitialStatus();
      
      // Set up timer for status changes
      simulationInterval = window.setInterval(() => {
        // Only run simulation if time is within bounds
        if (isWithinTimelineBounds()) {
          // More realistic simulation with longer running times:
          // - If running, only 5% chance to stop (machines should run much longer)
          // - If stopped, 80% chance to start (downtime should be shorter)
          let randomStatus: "0" | "1";
          
          if (lastStatus === "1") {
            // If was running, very low chance to stop (5%)
            randomStatus = Math.random() < 0.05 ? "0" : "1"; 
          } else {
            // If was stopped, high chance to start (80%)
            randomStatus = Math.random() < 0.8 ? "1" : "0";
          }
          
          // Only change status if different from current
          if (randomStatus !== lastStatus) {
            // Generate random reason for downtime
            if (randomStatus === "0") {
              addSignalLog(selectedMachine, randomStatus, getRandomDowntimeReason());
            } else {
              addSignalLog(selectedMachine, randomStatus);
            }
          }
        }
      }, Math.floor(Math.random() * 15000) + 30000); // Longer intervals: 30-45 seconds
    }
    
    return () => {
      if (simulationInterval) {
        console.log("Stopping simulation");
        clearInterval(simulationInterval);
      }
    };
  }, [isSimulating, selectedMachine, lastStatus]);

  return {
    signalLogs,
    newLogReason,
    setNewLogReason,
    addSignalLog,
    lastStatus
  };
}
