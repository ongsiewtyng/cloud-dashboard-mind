import { useState, useEffect, useCallback } from "react";
import { getRandomDowntimeReason, getCurrentTimeString } from "@/utils/signalUtils";
import {
  addSignalLog,
  subscribeToSignalLogs,
  updateSignalLogReason,
  updateAllLogDurations,
  type SignalLog
} from "@/lib/signal-service";

export function useSignalSimulation(selectedMachine: string | null) {
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([]);
  const [newLogReason, setNewLogReason] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastStatus, setLastStatus] = useState<"0" | "1">("1");
  const [lastSimulationTime, setLastSimulationTime] = useState<number | null>(null);
  const [runningTimeStart, setRunningTimeStart] = useState<number | null>(null);
  const [lastDowntimeStart, setLastDowntimeStart] = useState<number | null>(null);
  const [lastLogTime, setLastLogTime] = useState<number | null>(null);

  // Timeline boundaries (8 AM to 5 PM)
  const startTime = "08:00";
  const endTime = "17:00";

  // Function to add a signal log with proper duration tracking
  const addSignalLogToService = useCallback(async (
    machineId: string, 
    status: "0" | "1", 
    autoReason?: string,
    timestamp?: Date
  ) => {
    if (!machineId) return false;

    const now = timestamp || new Date();
    const logTimestamp = now.toTimeString().substring(0, 8); // HH:MM:SS
    const today = now.toISOString().split('T')[0];

    // Prevent duplicate logs in the same minute
    if (lastLogTime && (now.getTime() - lastLogTime) < 30000) { // 30 second minimum between logs
      return false;
    }

    const reason = status === "1" ? "" : (autoReason || newLogReason);

    // Calculate duration from the last status change
    let duration = "0m";
    if (status === "1" && lastDowntimeStart) {
      const minutes = Math.floor((now.getTime() - lastDowntimeStart) / 60000);
      duration = `${minutes}m`;
    } else if (status === "0" && runningTimeStart) {
      const minutes = Math.floor((now.getTime() - runningTimeStart) / 60000);
      duration = `${minutes}m`;
    }

    // Add log to Firebase
    const result = await addSignalLog(machineId, status, logTimestamp, reason);

    if (result) {
      setNewLogReason("");
      setLastStatus(status);
      setLastLogTime(now.getTime());
      
      // Update state based on status
      if (status === "1") {
        setRunningTimeStart(now.getTime());
        setLastDowntimeStart(null);
      } else {
        setLastDowntimeStart(now.getTime());
        setRunningTimeStart(null);
      }

      await updateAllLogDurations(machineId);
      return true;
    }

    return false;
  }, [newLogReason, lastDowntimeStart, runningTimeStart, lastLogTime]);

  // Simulation logic with realistic patterns
  const runSimulation = useCallback(async (machineId: string, currentStatus: "0" | "1") => {
    if (!isWithinTimelineBounds()) return;

    const now = Date.now();
    if (lastSimulationTime && (now - lastSimulationTime) < 60000) return;

    let shouldChangeStatus = false;
    let newStatus = currentStatus;
    
    if (currentStatus === "1") {
      const minutesRunning = runningTimeStart ? Math.floor((now - runningTimeStart) / 60000) : 0;
      
      // Machine is more likely to fail after running for a long time
      if (minutesRunning >= 30) {
        const baseFailureChance = 0.02; // 2% base chance after 30 minutes
        const additionalChancePerHour = 0.01; // Additional 1% per hour
        const hoursRunning = (minutesRunning - 30) / 60;
        const failureChance = Math.min(0.15, baseFailureChance + (hoursRunning * additionalChancePerHour));
        
        shouldChangeStatus = Math.random() < failureChance;
        if (shouldChangeStatus) {
          newStatus = "0";
        }
      }
    } else {
      const minutesDown = lastDowntimeStart ? Math.floor((now - lastDowntimeStart) / 60000) : 0;
      
      // Recovery logic: Most issues should resolve within 1-5 minutes
      if (minutesDown >= 1) {
        const recoveryChance = minutesDown <= 5 ? 0.3 : 0.6; // 30% chance per minute up to 5 min, then 60%
        shouldChangeStatus = Math.random() < recoveryChance;
        if (shouldChangeStatus) {
          newStatus = "1";
        }
      }
    }

    if (shouldChangeStatus && newStatus !== currentStatus) {
      const reason = newStatus === "0" ? getRandomDowntimeReason() : "";
      await addSignalLogToService(machineId, newStatus, reason);
      setLastSimulationTime(now);
    }
  }, [lastSimulationTime, runningTimeStart, lastDowntimeStart, addSignalLogToService]);

  // Check if current time is within timeline boundaries
  const isWithinTimelineBounds = useCallback(() => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const currentTimeMinutes = currentHours * 60 + currentMinutes;
    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  }, [startTime, endTime]);

  // Initialize simulation when machine is selected
  useEffect(() => {
    if (!selectedMachine) {
      setSignalLogs([]);
      setIsSimulating(false);
      return;
    }

    let isInitialized = false;
    
    const unsubscribe = subscribeToSignalLogs(selectedMachine, async (logs) => {
      setSignalLogs(logs);
      
      if (logs.length > 0) {
        const mostRecent = logs[0];
        setLastStatus(mostRecent.status);
        
        // Set appropriate time trackers based on current status
        const mostRecentTime = new Date();
        if (mostRecent.status === "1") {
          setRunningTimeStart(mostRecentTime.getTime());
          setLastDowntimeStart(null);
        } else {
          setLastDowntimeStart(mostRecentTime.getTime());
          setRunningTimeStart(null);
        }
      }

      // Initialize if no logs exist for today
      if (!isInitialized && isWithinTimelineBounds()) {
        isInitialized = true;
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const todayLogs = logs.filter(log => log.date === today);
        
        if (todayLogs.length === 0) {
          // Start with running status (95% chance) at beginning of day
          const initialStatus = Math.random() > 0.05 ? "1" : "0";
          const startOfDay = new Date();
          startOfDay.setHours(8, 0, 0, 0);
          
          await addSignalLogToService(selectedMachine, initialStatus, 
            initialStatus === "0" ? getRandomDowntimeReason() : undefined,
            startOfDay
          );
        }
      }
    });

    setIsSimulating(true);

    return () => {
      console.log("Unsubscribing from signal logs");
      unsubscribe();
    };
  }, [selectedMachine, addSignalLogToService, isWithinTimelineBounds]);

  // Run simulation at regular intervals
  useEffect(() => {
    if (isSimulating && selectedMachine) {
      const simulationInterval = window.setInterval(() => {
        runSimulation(selectedMachine, lastStatus);
      }, 60000); // Check every minute

      return () => clearInterval(simulationInterval);
    }
  }, [isSimulating, selectedMachine, lastStatus, runSimulation]);

  // Update a log's reason
  const updateLogReason = async (logId: string, reason: string) => {
    if (!selectedMachine) return false;
    const success = await updateSignalLogReason(logId, reason, selectedMachine);
    if (success) setNewLogReason("");
    return success;
  };

  return {
    signalLogs,
    newLogReason,
    setNewLogReason,
    addSignalLog: addSignalLogToService,
    updateLogReason,
    lastStatus,
    timeRange: { startTime, endTime }
  };
}