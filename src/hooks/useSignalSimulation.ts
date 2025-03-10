import { useState, useEffect } from "react";
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

  // Timeline boundaries (8 AM to 5 PM)
  const startTime = "08:00";
  const endTime = "17:00";

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastSimulationTime) {
        const now = Date.now();
        const timeSinceLastSimulation = now - lastSimulationTime;
        
        // If more than 1 minute has passed, catch up on missed simulations
        if (timeSinceLastSimulation > 60000 && selectedMachine && isSimulating) {
          console.log(`Catching up on ${Math.floor(timeSinceLastSimulation / 60000)} minutes of missed simulation`);
          runSimulation(selectedMachine, lastStatus);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastSimulationTime, selectedMachine, isSimulating, lastStatus]);

  // Subscribe to real-time signal logs when a machine is selected
  useEffect(() => {
    if (!selectedMachine) {
      setSignalLogs([]);
      setIsSimulating(false);
      return;
    }

    let isInitialized = false;
    console.log("Subscribing to signal logs for machines:", selectedMachine);
    
    const unsubscribe = subscribeToSignalLogs(selectedMachine, async (logs) => {
      setSignalLogs(logs);
      
      // Set last status based on most recent log
      if (logs.length > 0) {
        setLastStatus(logs[0].status);
      }

      // Only try to initialize once when we first get the logs
      if (!isInitialized && isWithinTimelineBounds()) {
        isInitialized = true;
        const today = new Date().toISOString().split('T')[0];
        const hasLogsForToday = logs.some(log => log.date === today);
        
        if (!hasLogsForToday) {
          console.log("No logs found for today, initializing...");
          const initialStatus = Math.random() > 0.05 ? "1" : "0";
          const reason = initialStatus === "0" ? getRandomDowntimeReason() : "";
          await addSignalLogToService(selectedMachine, initialStatus, reason);
        } else {
          console.log("Found existing logs for today, skipping initialization");
        }
      }
    });

    // Start simulation
    setIsSimulating(true);

    return () => {
      console.log("Unsubscribing from signal logs");
      unsubscribe();
    };
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

  // Function to add a signal log
  const addSignalLogToService = async (machineId: string, status: "0" | "1", autoReason?: string) => {
    if (!machineId) return false;

    // Format timestamp in HH:MM:SS format
    const timestamp = getCurrentTimeString();
    
    // Extract HH:MM from timestamp
    const timeMinute = timestamp.substring(0, 5);
    
    // Check if we already have a log in this minute
    const existingLogInMinute = signalLogs.find(log => {
      const logMinute = log.timestamp.substring(0, 5);
      return logMinute === timeMinute;
    });

    if (existingLogInMinute) {
      console.log("Skipping duplicate log in same minute:", timeMinute);
      return false;
    }

    let reason = status === "1" ? "" : newLogReason;

    if (autoReason && status === "0") {
      reason = autoReason;
    }

    // Add log to Firebase
    const result = await addSignalLog(machineId, status, timestamp, reason);

    if (result) {
      setNewLogReason("");
      setLastStatus(status);

      // Update durations of all logs when a new log is added
      await updateAllLogDurations(machineId);

      return true;
    }

    return false;
  };

  // Simulation logic extracted to a separate function
  const runSimulation = async (machineId: string, currentStatus: "0" | "1") => {
    if (!isWithinTimelineBounds()) return;

    let randomStatus: "0" | "1";
    const now = Date.now();
    setLastSimulationTime(now);

    if (currentStatus === "1") {
      const minutesRunning = runningTimeStart ? 
        Math.floor((now - runningTimeStart) / 60000) : 0;
      
      const downChance = Math.min(0.3, 0.05 + (Math.floor(minutesRunning / 5) * 0.01));
      randomStatus = Math.random() < downChance ? "0" : "1";
      
      if (randomStatus === "0") {
        setLastDowntimeStart(now);
        setRunningTimeStart(null);
        console.log(`Machine going down after running for ${minutesRunning} minutes`);
      }
    } else {
      const minutesDown = lastDowntimeStart ? 
        Math.floor((now - lastDowntimeStart) / 60000) : 0;
      
      const recoveryChance = Math.min(0.9, 0.2 * (minutesDown + 1));
      randomStatus = Math.random() < recoveryChance ? "1" : "0";
      
      if (randomStatus === "1") {
        console.log(`Machine recovered after ${minutesDown} minutes`);
        setLastDowntimeStart(null);
        setRunningTimeStart(now);
      }
    }

    if (randomStatus !== currentStatus) {
      const reason = randomStatus === "0" ? getRandomDowntimeReason() : "";
      await addSignalLogToService(machineId, randomStatus, reason);
      console.log("Status changed and logged:", randomStatus);
    }
  };

  // Simulation effect with background support
  useEffect(() => {
    if (isSimulating && selectedMachine) {
      console.log("Starting real-time simulation for machine:", selectedMachine);
      
      if (lastStatus === "1") {
        setRunningTimeStart(Date.now());
      }

      const simulationInterval = window.setInterval(() => {
        runSimulation(selectedMachine, lastStatus);
      }, 60000);

      return () => {
        console.log("Stopping simulation");
        clearInterval(simulationInterval);
      };
    }
  }, [isSimulating, selectedMachine, lastStatus]);

  // Update a log's reason
  const updateLogReason = async (logId: string, reason: string) => {
    if (!selectedMachine) return false;

    const success = await updateSignalLogReason(logId, reason, selectedMachine);
    if (success) {
      setNewLogReason("");
    }
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