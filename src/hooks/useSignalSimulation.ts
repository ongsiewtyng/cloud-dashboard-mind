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

  // Timeline boundaries (8 AM to 5 PM)
  const startTime = "08:00";
  const endTime = "17:00";

  // Subscribe to real-time signal logs when a machine is selected
  useEffect(() => {
    if (!selectedMachine) {
      setSignalLogs([]);
      setIsSimulating(false);
      return;
    }

    let isInitialized = false;
    console.log("Subscribing to signal logs for machine:", selectedMachine);
    
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

  // Simulation effect
  useEffect(() => {
    let simulationInterval: number | null = null;
    let lastDowntimeStart: number | null = null;
    let runningTimeStart: number | null = null;

    if (isSimulating && selectedMachine) {
      console.log("Starting real-time simulation for machine:", selectedMachine);
      
      // Initialize running time start if we're starting in running state
      if (lastStatus === "1") {
        runningTimeStart = Date.now();
      }

      simulationInterval = window.setInterval(async () => {
        if (isWithinTimelineBounds()) {
          let randomStatus: "0" | "1";
          
          if (lastStatus === "1") {
            // Calculate how long we've been running
            const minutesRunning = runningTimeStart ? 
              Math.floor((Date.now() - runningTimeStart) / 60000) : 0;
            
            // Probability of going down increases slightly with running time
            // Base chance is 5% per minute, increasing by 1% every 5 minutes
            const downChance = Math.min(0.3, 0.05 + (Math.floor(minutesRunning / 5) * 0.01));
            randomStatus = Math.random() < downChance ? "0" : "1";
            
            if (randomStatus === "0") {
              // If we're going down, record the time and reset running time
              lastDowntimeStart = Date.now();
              runningTimeStart = null;
              console.log(`Machine going down after running for ${minutesRunning} minutes`);
            }
          } else {
            // When down, calculate how long we've been down
            const minutesDown = lastDowntimeStart ? 
              Math.floor((Date.now() - lastDowntimeStart) / 60000) : 0;
            
            // Recovery chance increases by 20% each minute, max 90%
            const recoveryChance = Math.min(0.9, 0.2 * (minutesDown + 1));
            randomStatus = Math.random() < recoveryChance ? "1" : "0";
            
            console.log(`Minutes down: ${minutesDown}, Recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
            
            // If we recover, reset downtime start and record running start
            if (randomStatus === "1") {
              console.log(`Machine recovered after ${minutesDown} minutes`);
              lastDowntimeStart = null;
              runningTimeStart = Date.now();
            }
          }

          if (randomStatus !== lastStatus) {
            const reason = randomStatus === "0" ? getRandomDowntimeReason() : "";
            await addSignalLogToService(selectedMachine, randomStatus, reason);
            console.log("Status changed and logged:", randomStatus);
          }
        }
      }, 60000); // Check every minute
    }

    return () => {
      if (simulationInterval) {
        console.log("Stopping simulation");
        clearInterval(simulationInterval);
      }
    };
  }, [isSimulating, selectedMachine, lastStatus, signalLogs]);

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